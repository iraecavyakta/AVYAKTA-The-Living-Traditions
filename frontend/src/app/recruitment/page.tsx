import { redirect } from "next/navigation";
import RecruitmentForm from "@/components/forms/RecruitmentForm";
import bgImage from "@/components/forms/bg.jpeg";
import bgFormsImage from "@/components/forms/bg-forms.jpeg";
import { getRecruitmentStatus } from "@/lib/config/recruitmentStatus";
import "./recruitment.css";

// Must always be checked live, never statically frozen - this is a real
// on/off gate an admin expects to take effect immediately.
export const dynamic = "force-dynamic";

export default async function RecruitmentPage() {
  const isOpen = await getRecruitmentStatus();

  if (!isOpen) {
    redirect("/recruitment-closed");
  }

  return (
    <main
      className="recruitment-page"
      style={{ backgroundImage: `url(${bgImage.src})` }}
    >
      <div className="recruitment-inner">
        <div className="recruitment-header">
          <h1 className="recruitment-title">Join Avyakta</h1>
          <p className="recruitment-subtitle">
            Discover your passion, grow with our community, and lead cultural
            innovation
          </p>
        </div>

        <div className="rangoli-divider">
          <div className="rangoli-symbol"></div>
        </div>

        <RecruitmentForm bgImage={bgFormsImage.src} />
      </div>
    </main>
  );
}
