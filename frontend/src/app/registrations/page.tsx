import RegistrationForm from "@/components/forms/RegistrationForm";
import bgImage from "@/components/forms/bg.jpeg";
import bgFormsImage from "@/components/forms/bg-forms.jpeg";
import "../recruitment/recruitment.css"; // Reuse recruitment styles
import { getEventsFromDb } from "@/lib/data/events";
import { isRegistrationOpen } from "@/lib/utils/events";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  const allEvents = await getEventsFromDb();

  // Filter for events that can be registered for (upcoming primarily)
  const upcomingEvents = allEvents.filter((e) => e.status === "upcoming");

  const supabase = await createClient();
  const { data: registrationFlags } = await supabase
    .from("events")
    .select(
      "id, payment_image_required, registration_status, registration_deadline",
    )
    .in(
      "id",
      upcomingEvents.map((e) => e.id),
    );

  const flagsById = new Map(
    (registrationFlags ?? []).map((row) => [row.id, row]),
  );

  const availableEvents = upcomingEvents
    .filter((e) => {
      const flags = flagsById.get(e.id);
      return !flags || isRegistrationOpen(flags);
    })
    .map((e) => ({
      id: e.id,
      title: e.title,
      payment_image_required: Boolean(
        flagsById.get(e.id)?.payment_image_required,
      ),
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
