export const RESERVED_SLUGS = new Set([
  "api",
  "login",
  "signup",
  "logout",
  "edit",
  "card",
  "me",
  "admin",
  "assets",
  "static",
  "favicon.ico",
  "grain.png",
  "index",
  "index.html",
  "robots.txt",
  "sitemap.xml",
]);

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

export function isValidSlugFormat(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}
