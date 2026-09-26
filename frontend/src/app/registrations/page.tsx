import RegistrationForm from "@/components/forms/RegistrationForm";
import bgImage from "@/components/forms/bg.jpeg";
import bgFormsImage from "@/components/forms/bg-forms.jpeg";
import "../recruitment/recruitment.css"; // Reuse recruitment styles
import { getEventsFromDb } from "@/lib/data/events";

export const revalidate = 60;

export default async function RegistrationsPage() {
  const allEvents = await getEventsFromDb();

  // Filter for events that can be registered for (upcoming primarily)
  const availableEvents = allEvents
    .filter((e) => e.status === "upcoming")
    .map((e) => ({
      id: e.id,
      title: e.title,
    }));

  return (
    <main
      className="recruitment-page"
      style={{ backgroundImage: `url(${bgImage.src})` }}
    >
      <div className="recruitment-inner">
        <div className="recruitment-header">
          <h1 className="recruitment-title">Event Registration</h1>
          <p className="recruitment-subtitle text-[var(--charcoal-black)]">
            Join us as a participant or shape the experience as a volunteer. The
            choice is yours.
          </p>
        </div>

        <div className="rangoli-divider">
          <div className="rangoli-symbol"></div>
        </div>

        <RegistrationForm bgImage={bgFormsImage.src} events={availableEvents} />
      </div>
    </main>
  );
}
