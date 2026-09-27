import { useEffect, useState } from "react";
import { apiUrl } from "../config/api";
import { homeContent } from "../content/homeContent";
import { GuestbookForm } from "./GuestbookForm";

type PublicMessage = { id: string; name: string; message: string; createdAt: string };

export function GuestbookPage({ goHome }: { goHome: () => void }) {
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(apiUrl("/api/guestbook")).then((response) => response.ok ? response.json() : Promise.reject()).then((data: { messages: PublicMessage[] }) => setMessages(data.messages)).catch(() => setMessages([])).finally(() => setLoading(false)); }, []);
  return <main className="guestbook-page"><header><button type="button" onClick={goHome}>← Home</button><p>PUBLIC GUESTBOOK</p></header><section><h1>{homeContent.labels.guestbookPublic}</h1><p className="guestbook-lead">공개로 남긴 인사만 이곳에 보입니다. 이메일과 비공개 글은 관리자만 확인할 수 있습니다.</p><GuestbookForm /><div className="public-messages"><h2>남겨진 글</h2>{loading ? <p>불러오는 중입니다.</p> : messages.length ? messages.map((item) => <article key={item.id}><div><strong>{item.name}</strong><time>{item.createdAt}</time></div><p>{item.message}</p></article>) : <p>첫 번째 글을 남겨 주세요.</p>}</div></section></main>;
}
