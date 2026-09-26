import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import DomainDashboardClient from "@/components/dashboard/DomainDashboardClient";
import { isValidDomain } from "@/lib/utils/domainValidator";

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  if (!isValidDomain(domain)) {
    notFound();
  }

  return (
    // Rises in from below when a domain head arrives from a successful login.
    <ViewTransition
      enter={{ "login-success": "auto-scroll-in", default: "none" }}
      default="none"
    >
      <DomainDashboardClient domain={domain} />
    </ViewTransition>
  );
}
