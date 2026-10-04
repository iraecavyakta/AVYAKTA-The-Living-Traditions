import type { Metadata } from "next";
import EditApplication from "@/components/forms/EditApplication";
import bgImage from "@/components/forms/bg-recruitment.jpg";
import bgFormsImage from "@/components/forms/bg-forms.jpeg";
import "../recruitment.css";

// The private token is in this page's URL, so keep it out of search engines
// and out of the Referer header of anything the page links to.
export const metadata: Metadata = {
  title: "Your Application | Avyakta",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function EditApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main
      className="recruitment-page recruitment-page--dark"
      style={{ backgroundImage: `url(${bgImage.src})` }}
    >
      <div className="recruitment-inner">
        <div className="recruitment-header">
          <h1 className="recruitment-title">Your Application</h1>
          <p className="recruitment-subtitle">
            Track your progress, and fix or add to your answers until your
            interview begins
          </p>
        </div>

        <div className="rangoli-divider">
          <div className="rangoli-symbol"></div>
        </div>

        <EditApplication token={token ?? ""} bgImage={bgFormsImage.src} />
      </div>
    </main>
  );
}
