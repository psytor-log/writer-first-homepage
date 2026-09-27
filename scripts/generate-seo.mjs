import { mkdir, writeFile } from "node:fs/promises";

const outputDirectory = new URL("../dist/", import.meta.url);
const siteUrl = (process.env.VITE_SITE_URL || "").replace(/\/+$/, "");
const homepage = siteUrl ? `${siteUrl}/` : "";
const lastModified = new Date().toISOString().slice(0, 10);
const robots = ["User-agent: Googlebot\nAllow: /", "User-agent: NaverBot\nAllow: /", "User-agent: OAI-SearchBot\nAllow: /", "User-agent: GPTBot\nDisallow: /", "User-agent: *\nAllow: /", homepage && `Sitemap: ${siteUrl}/sitemap.xml`].filter(Boolean).join("\n\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${homepage ? `\n  <url>\n    <loc>${homepage}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </url>` : ""}\n</urlset>\n`;
const feed = `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ko">\n  <title>기록의 책상</title>\n  <subtitle>생각을 쓰고, 경험을 남기고, 다시 찾는 개인 기록 공간</subtitle>${homepage ? `\n  <id>${homepage}</id>\n  <link href="${homepage}" />` : ""}\n  <updated>${new Date().toISOString()}</updated>\n</feed>\n`;
await mkdir(outputDirectory, { recursive: true });
await Promise.all([writeFile(new URL("robots.txt", outputDirectory), robots), writeFile(new URL("sitemap.xml", outputDirectory), sitemap), writeFile(new URL("feed.xml", outputDirectory), feed)]);
