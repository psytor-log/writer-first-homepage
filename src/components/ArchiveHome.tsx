import { useMemo, useState } from "react";
import { homeContent, type ArticleBlock, type CategoryBlock } from "../content/homeContent";
import { GuestbookForm } from "./GuestbookForm";

type ArchiveHomeProps = {
  requestStudio: () => void;
  showGuestbook: () => void;
};

function CategoryTree({ categories, onNavigate }: { categories: readonly CategoryBlock[]; onNavigate?: (href: string) => void }) {
  return <ul className="category-tree">{categories.map((category) => <li key={category.id}><a href={category.href} onClick={(event) => { if (category.href.startsWith("#")) { event.preventDefault(); onNavigate?.(category.href); } }}>{category.label}{typeof category.count === "number" && <small>({category.count})</small>}</a>{category.children && <CategoryTree categories={category.children} onNavigate={onNavigate} />}</li>)}</ul>;
}

function ArticleRow({ article }: { article: ArticleBlock }) {
  return <article className="archive-article"><a className="article-image" href={article.href}><img src={article.image} alt={article.alt} /></a><div><p className="article-meta">{article.date} <span>·</span> {article.category}</p><h2><a href={article.href}>{article.title}</a></h2><p className="article-excerpt">{article.excerpt}</p><a className="article-link" href={article.href}>{homeContent.labels.readMore} <span>›</span></a></div></article>;
}

function PopularArticle({ article }: { article: ArticleBlock }) {
  return <a className="popular-article" href={article.href}><img src={article.image} alt="" /><span><strong>{article.title}</strong><small>{article.date} · {article.category}</small></span></a>;
}

export function ArchiveHome({ requestStudio, showGuestbook }: ArchiveHomeProps) {
  const [query, setQuery] = useState("");
  const visibleArticles = useMemo(() => [...homeContent.articles].filter((article) => `${article.title} ${article.excerpt} ${article.category}`.toLowerCase().includes(query.toLowerCase())).sort((first, second) => second.publishedAt.localeCompare(first.publishedAt)), [query]);
  const popularArticles = homeContent.popularArticleIds.map((id) => homeContent.articles.find((article) => article.id === id)).filter((article): article is ArticleBlock => Boolean(article));

  const navigate = (href: string) => { if (href === "#guestbook") showGuestbook(); else window.scrollTo({ top: 0, behavior: "smooth" }); };
  return <main className="archive-layout"><aside className="archive-left"><nav aria-label="카테고리"><CategoryTree categories={homeContent.categories} onNavigate={navigate} /></nav><div className="archive-identity"><h1>{homeContent.profile.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1><form onSubmit={(event) => event.preventDefault()}><label htmlFor="newsletter">{homeContent.profile.newsletterTitle}</label><div><input id="newsletter" type="email" placeholder={homeContent.profile.newsletterPlaceholder} /><button aria-label="구독">↗</button></div></form><button className="admin-entry" type="button" onClick={requestStudio}>관리자 글쓰기</button><p>{homeContent.profile.copyright}</p></div></aside><section className="archive-main"><header className="mobile-archive-header"><a href="#top">기록의 책상</a><button type="button" onClick={requestStudio}>글쓰기 ↗</button></header><div className="article-feed" id="top">{visibleArticles.map((article) => <ArticleRow key={article.id} article={article} />)}{visibleArticles.length === 0 && <p className="empty-results">{homeContent.labels.noResults}</p>}</div></section><aside className="archive-right"><label className="archive-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={homeContent.labels.searchPlaceholder} /><span>⌕</span></label><section className="right-block"><h2>{homeContent.labels.popular}</h2>{popularArticles.map((article) => <PopularArticle key={article.id} article={article} />)}</section><section className="right-block"><h2>{homeContent.labels.tags}</h2><div className="tag-cloud">{homeContent.tags.map((tag) => <a href={`/tags/${tag}`} key={tag}>{tag}</a>)}</div></section><GuestbookForm /></aside></main>;
}
