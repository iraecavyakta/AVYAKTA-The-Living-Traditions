const LEGACY_DOMAIN_ALIASES: Record<string, string[]> = {
  "Finance and Ethics": ["Finance and Ethics", "Ethics and Discipline", "Finance"],
  Logistics: ["Logistics"],
  Operations: ["Operations", "Logistics and Operations"],
};

export function canonicalDomainName(domain: string): string {
  if (domain === "Ethics and Discipline" || domain === "Finance") {
    return "Finance and Ethics";
  }
  // Historical members of the combined team are grouped with Operations;
  // new member records can now be assigned distinctly to Logistics.
  if (domain === "Logistics and Operations") return "Operations";
  return domain;
}

export function domainReadAliases(domain: string): string[] {
  const canonical = canonicalDomainName(domain);
  return LEGACY_DOMAIN_ALIASES[canonical] ?? [canonical];
}
