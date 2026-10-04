import { RECRUITMENT_DOMAINS } from "./recruitment";

// The club's domains (RECRUITMENT_DOMAINS) are the single source of truth; the
// URL slug is just the lowercase, hyphenated name.
export const DOMAIN_MAP = RECRUITMENT_DOMAINS.map((name) => ({
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
}));

export const VALID_DOMAIN_NAMES: string[] = DOMAIN_MAP.map((d) => d.name);
export const VALID_DOMAIN_SLUGS: string[] = DOMAIN_MAP.map((d) => d.slug);

export function getDomainNameFromSlug(slug: string): string | null {
  return DOMAIN_MAP.find((d) => d.slug === slug.toLowerCase())?.name ?? null;
}

export function getDomainSlugFromName(domainName: string): string | null {
  return (
    DOMAIN_MAP.find((d) => d.name.toLowerCase() === domainName.toLowerCase())
      ?.slug ?? null
  );
}
