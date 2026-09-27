export type CategoryBlock = {
  id: string;
  label: string;
  count?: number;
  href: string;
  children?: CategoryBlock[];
};

export type ArticleBlock = {
  id: string;
  category: string;
  date: string;
  publishedAt: string;
  title: string;
  excerpt: string;
  image: string;
  alt: string;
  href: string;
};

export const homeContent = {
  profile: {
    title: "기록의\n책상",
    newsletterTitle: "새 기록을 받아보기",
    newsletterPlaceholder: "이메일 주소",
    copyright: "© 2026 개인홈페이지. 천천히 쓴 기록을 남깁니다.",
  },
  labels: {
    searchPlaceholder: "기록에서 찾기",
    categories: "카테고리",
    popular: "인기 아티클",
    tags: "태그",
    readMore: "자세히 읽기",
    noResults: "찾는 기록이 없습니다.",
    guestbook: "글 남기기",
    guestbookDescription: "읽은 마음이나 짧은 인사를 남겨 주세요.",
    guestbookName: "닉네임",
    guestbookEmail: "이메일",
    guestbookMessage: "남길 글",
    guestbookPrivate: "관리자에게만 보이기",
    guestbookSubmit: "글 남기기",
    guestbookPublic: "방명록",
  },
  categories: [
    { id: "home", label: "Home", href: "#home" },
    { id: "milestones", label: "발자취", count: 12, href: "/milestones" },
    { id: "business", label: "비즈로그", count: 18, href: "/business", children: [{ id: "plans", label: "계획과 회고", count: 9, href: "/business/reviews" }] },
    { id: "essays", label: "에세이", count: 24, href: "/essays" },
    { id: "life", label: "일상", count: 31, href: "/life" },
    { id: "library", label: "지식 라이브러리", count: 16, href: "/library" },
    { id: "guestbook", label: "방명록", href: "#guestbook" },
  ] satisfies CategoryBlock[],
  articles: [
    { id: "writing-again", category: "에세이", date: "2026. 09. 27", publishedAt: "2026-09-27", title: "문장을 다시 믿어 보기", excerpt: "더 편하게 쓰기 위해 홈페이지를 다시 설계하면서 기록의 리듬을 생각했다.", image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=480&q=80", alt: "열린 책과 노트", href: "/essays/writing-again" },
    { id: "small-systems", category: "비즈로그", date: "2026. 09. 18", publishedAt: "2026-09-18", title: "일을 계속하게 만드는 작은 구조", excerpt: "계획을 실행 가능한 단위로 바꾸고, 회고를 다음 주의 재료로 남기는 법.", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=480&q=80", alt: "글을 쓰는 손", href: "/business/small-systems" },
    { id: "walks", category: "일상", date: "2026. 09. 06", publishedAt: "2026-09-06", title: "걸으며 생각이 정리되는 오후", excerpt: "멀리 가지 않아도 하루의 밀도가 바뀌는 산책에 관하여.", image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=480&q=80", alt: "산과 호수 풍경", href: "/life/walks" },
    { id: "knowledge-map", category: "지식 라이브러리", date: "2026. 08. 29", publishedAt: "2026-08-29", title: "다시 찾을 지식을 남기는 방법", excerpt: "읽고, 이해하고, 연결하기 위해 나만의 지식 지도를 만드는 기준.", image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=480&q=80", alt: "책장", href: "/library/knowledge-map" },
  ] satisfies ArticleBlock[],
  popularArticleIds: ["writing-again", "knowledge-map", "small-systems"],
  tags: ["기록", "생각", "비즈니스", "회고", "독서", "여행", "일상", "지식"],
} as const;
