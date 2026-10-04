import { VALID_DOMAIN_SLUGS } from "@/lib/validators/domainMap";

export function isValidDomain(domainParam: string): boolean {
  return VALID_DOMAIN_SLUGS.includes(domainParam.toLowerCase());
}
