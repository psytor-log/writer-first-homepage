import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import type { JSONContent } from "@tiptap/core";
import { ResizableImage } from "./extensions";
import { ArchiveHome } from "./components/ArchiveHome";
import { GuestbookPage } from "./components/GuestbookPage";
import { apiUrl, authApiBaseUrl } from "./config/api";

type Screen = "home" | "studio" | "menu" | "guestbook";
type MenuItem = { id: string; label: string; href: string; depth: number; visible: boolean };

const starterContent: JSONContent = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "오늘은 오래 미뤄 둔 생각을 문장으로 꺼내 본다." }] },
    { type: "paragraph", content: [{ type: "text", text: "완벽한 결론보다, 지금의 나에게 중요한 질문을 남기는 일이 먼저다." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "기록하는 방식" }] },
    { type: "paragraph", content: [{ type: "text", text: "사진과 문장은 같은 속도로 읽힌다. 사진을 고르면 본문 폭, 와이드, 직접 크기를 바로 바꿀 수 있다." }] },
  ],
};

const initialMenu: MenuItem[] = [
  { id: "milestones", label: "발자취", href: "/milestones", depth: 0, visible: true },
  { id: "business", label: "비즈로그", href: "/business", depth: 0, visible: true },
  { id: "reviews", label: "계획과 회고", href: "/business/reviews", depth: 1, visible: true },
  { id: "essays", label: "에세이", href: "/essays", depth: 0, visible: true },
  { id: "life", label: "일상", href: "/life", depth: 0, visible: true },
  { id: "library", label: "지식", href: "/library", depth: 0, visible: true },
];


function Icon({ children }: { children: string }) {
  return <span aria-hidden="true" className="icon">{children}</span>;
}

function ToolbarButton({ active, label, onClick, children }: { active?: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return <button className={`tool ${active ? "is-active" : ""}`} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>{children}</button>;
}

function EditorToolbar({ editor, onImage }: { editor: NonNullable<ReturnType<typeof useEditor>>; onImage: () => void }) {
  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string;
    const url = window.prompt("링크 주소", previousUrl || "https://");
    if (url === null) return;
    if (!url) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return <div className="editor-toolbar" role="toolbar" aria-label="글 서식">
    <ToolbarButton label="되돌리기" onClick={() => editor.chain().focus().undo().run()}><Icon>↶</Icon></ToolbarButton>
    <ToolbarButton label="다시하기" onClick={() => editor.chain().focus().redo().run()}><Icon>↷</Icon></ToolbarButton>
    <span className="tool-divider" />
    <select aria-label="문단 스타일" value={editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p"} onChange={(event) => {
      const value = event.target.value;
      if (value === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
      else if (value === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
      else editor.chain().focus().setParagraph().run();
    }}>
      <option value="p">본문</option><option value="h2">제목 2</option><option value="h3">제목 3</option>
    </select>
    <select aria-label="글꼴" defaultValue="" onChange={(event) => editor.chain().focus().setMark("textStyle", { fontFamily: event.target.value || null }).run()}>
      <option value="">기본 글꼴</option><option value="'Noto Serif KR', serif">명조</option><option value="Pretendard, sans-serif">고딕</option><option value="JetBrains Mono, monospace">코드풍</option>
    </select>
    <ToolbarButton label="굵게" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></ToolbarButton>
    <ToolbarButton label="기울임" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolbarButton>
    <ToolbarButton label="밑줄" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolbarButton>
    <ToolbarButton label="링크" active={editor.isActive("link")} onClick={setLink}><Icon>↗</Icon></ToolbarButton>
    <ToolbarButton label="글머리 목록" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><Icon>•≡</Icon></ToolbarButton>
    <ToolbarButton label="인용" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Icon>❝</Icon></ToolbarButton>
    <ToolbarButton label="왼쪽 정렬" onClick={() => editor.chain().focus().setTextAlign("left").run()}><Icon>≡</Icon></ToolbarButton>
    <ToolbarButton label="가운데 정렬" onClick={() => editor.chain().focus().setTextAlign("center").run()}><Icon>☰</Icon></ToolbarButton>
    <ToolbarButton label="사진 넣기" onClick={onImage}><Icon>▧</Icon></ToolbarButton>
  </div>;
}

function ImageContextBar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  if (!editor.isActive("image")) return null;
  const attrs = editor.getAttributes("image") as { width?: string; alignment?: string; alt?: string };
  const update = (values: Record<string, string>) => editor.chain().focus().updateAttributes("image", values).run();
  return <div className="image-context" aria-label="사진 편집">
    <span>사진</span>
    {[ ["46%", "작게"], ["100%", "본문"], ["calc(100% + 160px)", "와이드"] ].map(([width, label]) => <button key={width} className={attrs.width === width ? "is-selected" : ""} type="button" onClick={() => update({ width })}>{label}</button>)}
    <label>직접 <input aria-label="사진 너비" type="range" min="30" max="100" value={parseInt(attrs.width || "100", 10) || 100} onChange={(event) => update({ width: `${event.target.value}%` })} /></label>
    <select aria-label="사진 정렬" value={attrs.alignment || "center"} onChange={(event) => update({ alignment: event.target.value })}><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option></select>
    <input aria-label="대체 텍스트" value={attrs.alt || ""} placeholder="사진 설명" onChange={(event) => update({ alt: event.target.value })} />
    <button className="danger-text" type="button" onClick={() => editor.chain().focus().deleteSelection().run()}>삭제</button>
  </div>;
}

function Studio({ goHome, goMenu, menu }: { goHome: () => void; goMenu: () => void; menu: MenuItem[] }) {
  const [title, setTitle] = useState(() => localStorage.getItem("writer-title") || "문장을 다시 믿어 보기");
  const [summary, setSummary] = useState(() => localStorage.getItem("writer-summary") || "기록을 멈추지 않기 위해, 더 편한 글쓰기 도구가 필요했다.");
  const [savedAt, setSavedAt] = useState("방금 저장됨");
  const [preview, setPreview] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false }), TextStyle, Color, TextAlign.configure({ types: ["heading", "paragraph"] }), ResizableImage],
    content: (() => { const saved = localStorage.getItem("writer-content"); return saved ? JSON.parse(saved) : starterContent; })(),
    editorProps: {
      attributes: { class: "prose-canvas", "aria-label": "글 본문" },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files || []).find((item) => item.type.startsWith("image/"));
        if (!file) return false;
        const reader = new FileReader();
        reader.onload = () => editor?.chain().focus().setImage({ src: String(reader.result), alt: file.name }).run();
        reader.readAsDataURL(file);
        return true;
      },
      handleDrop: (_view, event) => {
        const file = Array.from(event.dataTransfer?.files || []).find((item) => item.type.startsWith("image/"));
        if (!file) return false;
        const reader = new FileReader();
        reader.onload = () => editor?.chain().focus().setImage({ src: String(reader.result), alt: file.name }).run();
        reader.readAsDataURL(file);
        return true;
      },
    },
    onUpdate: ({ editor: updated }) => {
      localStorage.setItem("writer-content", JSON.stringify(updated.getJSON()));
      setSavedAt("자동 저장됨");
    },
  });

  useEffect(() => {
    const timer = window.setTimeout(() => { localStorage.setItem("writer-title", title); localStorage.setItem("writer-summary", summary); setSavedAt("자동 저장됨"); }, 300);
    return () => window.clearTimeout(timer);
  }, [title, summary]);

  const insertImage = useCallback((file?: File) => {
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => editor.chain().focus().setImage({ src: String(reader.result), alt: file.name }).run();
    reader.readAsDataURL(file);
  }, [editor]);

  if (!editor) return null;
  return <main className="studio-shell">
    <aside className="studio-nav">
      <button className="brand-button" type="button" onClick={goHome}>기록의 책상 <span>↗</span></button>
      <button className="new-post" type="button" onClick={() => { setTitle(""); editor.commands.setContent(""); editor.commands.focus(); }}>＋ 새 글</button>
      <nav aria-label="스튜디오 탐색"><span className="nav-group">글</span><button className="nav-active" type="button">◉ 모든 글</button><button type="button">○ 임시 저장</button><button type="button">○ 발행됨</button><span className="nav-group">관리</span><button type="button" onClick={goMenu}>☷ 메뉴 편집</button></nav>
      <p className="studio-note">이 브라우저에 자동 저장됩니다.<br />발행 연결은 다음 단계에서 GitHub 또는 CMS 저장소로 교체합니다.</p>
    </aside>
    <section className="writer-area">
      <header className="studio-topbar"><div><button type="button" className="quiet-button" onClick={goHome}>← 읽기 화면</button><span className="save-status"><i /> {savedAt}</span></div><div><button type="button" className="quiet-button" onClick={() => setPreview(!preview)}>{preview ? "편집 계속" : "미리보기"}</button><button type="button" className="publish-button" onClick={() => alert("발행 전송은 배포 저장소를 연결하면 활성화됩니다. 지금은 이 브라우저에 안전하게 저장했습니다.")}>발행하기</button></div></header>
      <div className={`writer-grid ${preview ? "previewing" : ""}`}>
        <article className="editor-card">
          <div className="post-path"><span>에세이</span><span>·</span><span>임시 저장</span></div>
          <input className="title-input" aria-label="글 제목" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="제목 없이 시작해도 좋아요" />
          <textarea className="summary-input" aria-label="글 요약" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="이 글을 한 문장으로 설명해 주세요" rows={2} />
          <EditorToolbar editor={editor} onImage={() => fileInput.current?.click()} />
          <input ref={fileInput} hidden type="file" accept="image/*" onChange={(event) => insertImage(event.target.files?.[0])} />
          <ImageContextBar editor={editor} />
          <EditorContent editor={editor} />
          <button className="insert-block" type="button" onClick={() => editor.chain().focus().insertContent({ type: "horizontalRule" }).run()}>＋ 블록 추가</button>
        </article>
        <aside className="metadata-panel"><h2>글 설정</h2><label>기록 공간<select defaultValue="essays"><option value="milestones">발자취</option><option value="business">비즈로그</option><option value="essays">에세이</option><option value="life">일상</option><option value="library">지식</option></select></label><label>태그<input placeholder="생각, 기록" /></label><label>대표 이미지<button type="button" className="image-drop" onClick={() => fileInput.current?.click()}>사진을 넣어 보세요<br /><small>드롭·붙여넣기도 가능</small></button></label><label className="toggle-line"><input type="checkbox" /> 비공개 초안</label><hr /><p>현재 메뉴 {menu.filter((item) => item.visible && item.depth === 0).length}개가 상단에 표시됩니다.</p></aside>
      </div>
    </section>
  </main>;
}

function MenuEditor({ menu, setMenu, back }: { menu: MenuItem[]; setMenu: (menu: MenuItem[]) => void; back: () => void }) {
  const update = (id: string, updateValue: Partial<MenuItem>) => setMenu(menu.map((item) => item.id === id ? { ...item, ...updateValue } : item));
  const move = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= menu.length) return; const copy = [...menu]; [copy[index], copy[target]] = [copy[target], copy[index]]; setMenu(copy); };
  return <main className="menu-page"><header><button className="quiet-button" type="button" onClick={back}>← 글 편집</button><div><p className="eyebrow">NAVIGATION</p><h1>메뉴를 읽는 순서로 정리하세요.</h1><p>들여쓰기로 하위 메뉴를 만들고, 눈 아이콘으로 공개 여부를 정합니다.</p></div><button className="publish-button" type="button" onClick={() => localStorage.setItem("writer-menu", JSON.stringify(menu))}>저장하기</button></header><section className="tree-card">{menu.map((item, index) => <div className="menu-row" key={item.id} style={{ paddingLeft: `${24 + item.depth * 28}px` }}><span className="drag-handle">⠿</span><input value={item.label} aria-label={`${item.label} 메뉴 이름`} onChange={(event) => update(item.id, { label: event.target.value })} /><input value={item.href} aria-label={`${item.label} 메뉴 경로`} onChange={(event) => update(item.id, { href: event.target.value })} /><button type="button" title="위로" onClick={() => move(index, -1)}>↑</button><button type="button" title="아래로" onClick={() => move(index, 1)}>↓</button><button type="button" title="들여쓰기" onClick={() => update(item.id, { depth: Math.min(item.depth + 1, 2) })}>→</button><button type="button" title="내어쓰기" onClick={() => update(item.id, { depth: Math.max(item.depth - 1, 0) })}>←</button><button className={item.visible ? "visible" : ""} type="button" title="공개 여부" onClick={() => update(item.id, { visible: !item.visible })}>{item.visible ? "◉" : "○"}</button></div>)}</section><button className="add-menu" type="button" onClick={() => setMenu([...menu, { id: crypto.randomUUID(), label: "새 메뉴", href: "/new", depth: 0, visible: true }])}>＋ 메뉴 추가</button></main>;
}

function Home({ menu, requestStudio }: { menu: MenuItem[]; requestStudio: () => void }) {
  const topMenu = menu.filter((item) => item.visible && item.depth === 0);
  return <main className="andrea-home"><aside className="archive-aside"><a href="#top" className="archive-name">기록의<br />책상.</a><p className="archive-intro">생각과 일의 흔적을<br />오래 남기기 위한 개인 아카이브.</p><nav>{topMenu.map((item) => <a href={item.href} key={item.id}>{item.label}</a>)}</nav><div className="aside-bottom"><button type="button" onClick={requestStudio}>관리자 글쓰기 ↗</button><span>© 2026 개인홈페이지</span></div></aside><section className="archive-content" id="top"><header className="archive-mobile-header"><a href="#top">기록의 책상.</a><button type="button" onClick={requestStudio}>글쓰기 ↗</button></header><section className="archive-heading"><p>PERSONAL ARCHIVE / SEOUL</p><h1>천천히 쓴<br />기록을 모읍니다.</h1><span>2026 —</span></section><section className="archive-posts"><div className="posts-title"><h2>최근 기록</h2><a href="/archive">전체 보기 <b>→</b></a></div><article className="post-row"><div className="round-thumbnail thumb-essay"><span>문장</span></div><div className="post-summary"><p>ESSAY · 2026.09.27</p><h3>문장을 다시 믿어 보기</h3><span>더 편하게 쓰기 위해 홈페이지를 다시 설계하면서 기록의 리듬을 생각했다.</span><a href="/essays/writing-again">Read more →</a></div></article><article className="post-row"><div className="round-thumbnail thumb-business"><span>계획</span></div><div className="post-summary"><p>BUSINESS LOG · 2026.09.18</p><h3>일을 계속하게 만드는 작은 구조</h3><span>계획을 실행 가능한 단위로 바꾸고, 회고를 다음 주의 재료로 남기는 법.</span><a href="/business/small-systems">Read more →</a></div></article></section><section className="archive-categories"><p>EXPLORE BY RECORD</p><div>{topMenu.map((item, index) => <a key={item.id} href={item.href}><small>0{index + 1}</small><strong>{item.label}</strong><span>→</span></a>)}</div></section></section></main>;
}

function AdminLogin({ onClose, onAuthenticated }: { onClose: () => void; onAuthenticated: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("확인 중입니다.");
    try {
      const response = await fetch(apiUrl("/api/auth/login"), { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (!response.ok) throw new Error("invalid");
      sessionStorage.setItem("writer-admin-session", "active");
      onAuthenticated();
    } catch {
      setMessage("관리자 인증 서비스가 아직 연결되지 않았거나 아이디 또는 비밀번호가 맞지 않습니다.");
    }
  };
  return <div className="login-backdrop" role="presentation"><section className="login-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-login-title"><button className="dialog-close" type="button" onClick={onClose} aria-label="로그인 닫기">×</button><p className="eyebrow">ADMIN ONLY</p><h2 id="admin-login-title">글쓰기 관리자 로그인</h2><p>발행과 상단 메뉴 편집은 관리자만 사용할 수 있습니다.</p><form onSubmit={submit}><label>아이디<input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>비밀번호<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="login-submit" type="submit">로그인</button></form>{message && <p className="login-message" role="status">{message}</p>}</section></div>;
}

export function App() {
  const [screen, setScreen] = useState<Screen>(() => window.location.hash === "#guestbook" ? "guestbook" : "home");
  const [loginOpen, setLoginOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>(() => { const saved = localStorage.getItem("writer-menu"); return saved ? JSON.parse(saved) : initialMenu; });
  useEffect(() => {
    if (!authApiBaseUrl) return;
    fetch(apiUrl("/api/auth/session"), { credentials: "include" }).then((response) => setAuthenticated(response.ok)).catch(() => setAuthenticated(false));
  }, []);
  const requestStudio = () => { if (authenticated) setScreen("studio"); else setLoginOpen(true); };
  const openGuestbook = () => { window.location.hash = "guestbook"; setScreen("guestbook"); };
  const openHome = () => { window.history.replaceState(null, "", window.location.pathname); setScreen("home"); };
  const content = useMemo(() => screen === "home" ? <ArchiveHome requestStudio={requestStudio} showGuestbook={openGuestbook} /> : screen === "guestbook" ? <GuestbookPage goHome={openHome} /> : screen === "menu" ? <MenuEditor menu={menu} setMenu={setMenu} back={() => setScreen("studio")} /> : <Studio menu={menu} goHome={openHome} goMenu={() => setScreen("menu")} />, [authenticated, menu, screen]);
  return <>{content}{loginOpen && <AdminLogin onClose={() => setLoginOpen(false)} onAuthenticated={() => { setAuthenticated(true); setLoginOpen(false); setScreen("studio"); }} />}</>;
}
