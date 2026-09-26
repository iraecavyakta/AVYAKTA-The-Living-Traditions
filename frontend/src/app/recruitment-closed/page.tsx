import Link from "next/link";
import { redirect } from "next/navigation";
import bgImage from "@/components/forms/bg.jpeg";
import { getRecruitmentStatus } from "@/lib/config/recruitmentStatus";
import "../recruitment/recruitment.css";

export const dynamic = "force-dynamic";

export default async function RecruitmentClosedPage() {
  const isOpen = await getRecruitmentStatus();

  if (isOpen) {
    redirect("/recruitment");
  }

  return (
    <main
      className="recruitment-page"
      style={{ backgroundImage: `url(${bgImage.src})` }}
    >
      <div className="recruitment-inner">
        <div className="recruitment-header">
          <h1 className="recruitment-title">
            We&apos;re Not Recruiting Right Now
          </h1>
          <p className="recruitment-subtitle">
            Recruitment is currently closed. Follow our socials or check back
            later to know when applications open again.
          </p>
        </div>

        <div className="rangoli-divider">
          <div className="rangoli-symbol"></div>
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link
            href="/"
            className="inline-block rounded-full border border-white/40 px-8 py-3 text-[#F5F0E8] transition hover:scale-[1.03] hover:bg-white hover:text-[#1C1C1C]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
