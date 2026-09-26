"use client";

import { useEffect, useState } from "react";
import { isRegistrationOpen } from "@/lib/utils/events";
import DashboardPageBackground from "../layout/DashboardPageBackground";
import registrantsBackground from "../../../Admin_Dash_Img/5.png";

interface EventItem {
  id: string;
  title: string;
  date: string | null;
  venue?: string | null;
  registration_status?: boolean;
  registration_deadline?: string | null;
  payment_image_required?: boolean;
}

interface Registrant {
  id: string;
  event_id: string;
  name: string;
  srn: string;
  branch: string;
  hostel: boolean | null;
  email: string;
  phone_no: string;
  payment_image_url: string | null;
  is_volunteer: boolean | null;
  class_year: number | null;
  section: string | null;
  dietary_needs: string | null;
  team_name: string | null;
  volunteer_domain: string | null;
  volunteer_experience: string | null;
  links: string | null;
}

function parseLinks(links: string | null): string[] {
  if (!links) return [];
  try {
    const parsed = JSON.parse(links);
    return Array.isArray(parsed)
      ? parsed.filter((link) => typeof link === "string")
      : [];
  } catch {
    return [];
  }
}

export default function EventRegistrantsClient() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [error, setError] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [isLoadingRegistrants, setIsLoadingRegistrants] = useState(false);

  const [selectedRegistrant, setSelectedRegistrant] =
    useState<Registrant | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);
        const response = await fetch("/api/events?ts=" + Date.now(), {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Failed to fetch events");

        const result = await response.json();
        if (!result.success)
          throw new Error(result.error || "Failed to fetch events");

        setEvents(result.data || []);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const openEvent = async (event: EventItem) => {
    setSelectedEvent(event);
    setSelectedRegistrant(null);
    setRegistrants([]);
    setError("");

    try {
      setIsLoadingRegistrants(true);
      const response = await fetch(
        `/api/registrations?eventId=${encodeURIComponent(event.id)}`,
        { cache: "no-store" },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch registrants");
      }

      setRegistrants(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load registrants",
      );
    } finally {
      setIsLoadingRegistrants(false);
    }
  };

  return (
    <>
      <DashboardPageBackground src={registrantsBackground.src} />

      <main className="registrants-container">
        <div className="registrants-wrapper">
          <header className="registrants-header">
            <span className="corner corner-tl" aria-hidden />
            <span className="corner corner-br" aria-hidden />

            <p className="registrants-label">Avyakta Admin</p>
            <h1>Event Registrants</h1>
            <p className="registrants-tagline">
              Select an event to see who registered for it.
            </p>

            <div className="rangoli" aria-hidden>
              <span className="dot small" />
              <span className="dot large" />
              <span className="dot small" />
            </div>
          </header>

          {error && <div className="alert alert-error">{error}</div>}

          {!selectedEvent && (
            <div className="events-list">
              {isLoadingEvents ? (
                <p className="loading">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="empty-state">No events found</p>
              ) : (
                events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="event-row"
                    onClick={() => openEvent(event)}
                  >
                    <div>
                      <div className="event-title">{event.title}</div>
                      <div className="event-meta">
                        {event.date
                          ? new Date(event.date).toLocaleDateString()
                          : "No date"}{" "}
                        · {event.venue || "TBA"}
                        {event.payment_image_required && " · Payment required"}
                      </div>
                    </div>
                    <span
                      className={`status-badge ${isRegistrationOpen(event) ? "open" : "closed"}`}
                    >
                      {isRegistrationOpen(event) ? "Open" : "Closed"}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {selectedEvent && !selectedRegistrant && (
            <div className="registrants-panel">
              <button
                type="button"
                className="btn-back"
                onClick={() => setSelectedEvent(null)}
              >
                ← Back to events
              </button>
              <h2>{selectedEvent.title}</h2>
              {selectedEvent.payment_image_required && (
                <p className="payment-note">
                  This event requires payment proof from registrants
                </p>
              )}

              {isLoadingRegistrants ? (
                <p className="loading">Loading registrants...</p>
              ) : registrants.length === 0 ? (
                <p className="empty-state">No registrants yet for this event</p>
              ) : (
                <ul className="registrant-names">
                  {registrants.map((registrant) => (
                    <li key={registrant.id}>
                      <button
                        type="button"
                        className="registrant-row"
                        onClick={() => setSelectedRegistrant(registrant)}
                      >
                        {registrant.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {selectedEvent && selectedRegistrant && (
            <div className="registrant-detail">
              <button
                type="button"
                className="btn-back"
                onClick={() => setSelectedRegistrant(null)}
              >
                ← Back to registrants
              </button>
              <h2>{selectedRegistrant.name}</h2>

              <dl>
                <dt>Registering as</dt>
                <dd>
                  {selectedRegistrant.is_volunteer
                    ? "Volunteer"
                    : "Participant"}
                </dd>

                <dt>SRN</dt>
                <dd>{selectedRegistrant.srn}</dd>

                <dt>Branch</dt>
                <dd>{selectedRegistrant.branch}</dd>

                <dt>Year</dt>
                <dd>{selectedRegistrant.class_year ?? "—"}</dd>

                <dt>Section</dt>
                <dd>{selectedRegistrant.section || "—"}</dd>

                <dt>Email</dt>
                <dd>{selectedRegistrant.email}</dd>

                <dt>Phone</dt>
                <dd>{selectedRegistrant.phone_no}</dd>

                <dt>Hostel</dt>
                <dd>{selectedRegistrant.hostel ? "Yes" : "No"}</dd>

                {selectedRegistrant.is_volunteer ? (
                  <>
                    <dt>Volunteer Domain</dt>
                    <dd>{selectedRegistrant.volunteer_domain || "—"}</dd>

                    <dt>Volunteer Experience</dt>
                    <dd>{selectedRegistrant.volunteer_experience || "—"}</dd>
                  </>
                ) : (
                  <>
                    <dt>Team Name</dt>
                    <dd>{selectedRegistrant.team_name || "—"}</dd>

                    <dt>Dietary Needs</dt>
                    <dd>{selectedRegistrant.dietary_needs || "—"}</dd>
                  </>
                )}

                {parseLinks(selectedRegistrant.links).length > 0 && (
                  <>
                    <dt>Links</dt>
                    <dd>
                      <ul className="link-list">
                        {parseLinks(selectedRegistrant.links).map((link, i) => (
                          <li key={`${link}-${i}`}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </>
                )}

                {(selectedEvent.payment_image_required ||
                  selectedRegistrant.payment_image_url) && (
                  <>
                    <dt>Payment Proof</dt>
                    <dd>
                      {selectedRegistrant.payment_image_url ? (
                        <img
                          src={selectedRegistrant.payment_image_url}
                          alt="Payment proof"
                          className="payment-image"
                        />
                      ) : (
                        <span className="payment-missing">Not submitted</span>
                      )}
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}
        </div>

        <style jsx>{`
          .registrants-container {
            position: relative;
            z-index: 1;
            min-height: 100vh;
            padding: 48px 24px 64px;
          }

          .registrants-wrapper {
            max-width: 1000px;
            margin: 0 auto;
          }

          /* ---------- Header ---------- */
          .registrants-header {
            position: relative;
            background: var(--av-warm);
            border: 1px solid rgba(146, 121, 27, 0.35);
            border-radius: 18px;
            padding: 40px 32px 32px;
            margin-bottom: 32px;
            text-align: center;
            box-shadow: 0 24px 60px rgba(28, 28, 28, 0.45);
          }

          .corner {
            position: absolute;
            width: 34px;
            height: 34px;
            pointer-events: none;
          }

          .corner-tl {
            top: 14px;
            left: 14px;
            border-top: 2px solid rgba(201, 168, 76, 0.75);
            border-left: 2px solid rgba(201, 168, 76, 0.75);
            border-top-left-radius: 10px;
          }

          .corner-br {
            bottom: 14px;
            right: 14px;
            border-bottom: 2px solid rgba(201, 168, 76, 0.75);
            border-right: 2px solid rgba(201, 168, 76, 0.75);
            border-bottom-right-radius: 10px;
          }

          .registrants-label {
            margin: 0;
            font-family: var(--font-body), sans-serif;
            font-size: 11px;
            font-weight: 600;
            color: var(--av-olive);
            letter-spacing: 5px;
            text-transform: uppercase;
          }

          .registrants-header h1 {
            margin: 12px 0 8px;
            font-family: var(--font-heading), serif;
            font-size: 44px;
            font-weight: 600;
            color: var(--av-bronze);
            letter-spacing: 0.5px;
          }

          .registrants-tagline {
            margin: 0;
            font-family: var(--font-accent), serif;
            font-style: italic;
            font-size: 16px;
            color: rgba(28, 28, 28, 0.7);
          }

          .rangoli {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin-top: 24px;
          }

          .dot {
            border-radius: 50%;
            background: var(--av-gold);
          }

          .dot.small {
            width: 6px;
            height: 6px;
            opacity: 0.6;
          }

          .dot.large {
            width: 10px;
            height: 10px;
          }

          /* ---------- Alerts ---------- */
          .alert {
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            font-family: var(--font-body), sans-serif;
            font-size: 14px;
            font-weight: 500;
          }

          .alert-error {
            background: var(--av-warm);
            color: var(--av-crimson);
            border: 1px solid rgba(139, 26, 26, 0.45);
            border-left: 4px solid var(--av-crimson);
          }

          .loading,
          .empty-state {
            padding: 40px 24px;
            text-align: center;
            font-family: var(--font-accent), serif;
            font-style: italic;
            font-size: 15px;
            color: var(--av-olive);
          }

          /* ---------- Shared panel ---------- */
          .events-list,
          .registrants-panel,
          .registrant-detail {
            position: relative;
            background: var(--av-warm);
            border: 1px solid rgba(146, 121, 27, 0.3);
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 16px 40px rgba(28, 28, 28, 0.35);
            animation: fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          /* Gold accent along the top edge */
          .events-list::before,
          .registrants-panel::before,
          .registrant-detail::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            border-radius: 16px 16px 0 0;
            background: linear-gradient(
              90deg,
              transparent,
              var(--av-gold),
              transparent
            );
          }

          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* ---------- Event picker ---------- */
          .events-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .event-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            width: 100%;
            padding: 18px 20px;
            text-align: left;
            background: rgba(146, 121, 27, 0.06);
            border: 1px solid rgba(146, 121, 27, 0.22);
            border-left: 3px solid transparent;
            border-radius: 12px;
            cursor: pointer;
            transition:
              transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
              background-color 0.25s ease,
              border-color 0.25s ease,
              box-shadow 0.25s ease;
          }

          .event-row:hover {
            transform: scale(1.02);
            background: rgba(146, 121, 27, 0.12);
            border-color: rgba(201, 168, 76, 0.55);
            border-left-color: var(--av-bronze);
            box-shadow: 0 8px 24px rgba(201, 168, 76, 0.22);
          }

          .event-title {
            font-family: var(--font-heading), serif;
            font-size: 20px;
            font-weight: 600;
            color: var(--av-charcoal);
          }

          .event-meta {
            margin-top: 4px;
            font-family: var(--font-body), sans-serif;
            font-size: 12px;
            font-variant-numeric: lining-nums tabular-nums;
            color: var(--av-olive);
          }

          .status-badge {
            flex-shrink: 0;
            padding: 6px 14px;
            border-radius: 999px;
            font-family: var(--font-body), sans-serif;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
          }

          .status-badge.open {
            background: rgba(27, 94, 59, 0.12);
            border: 1px solid rgba(27, 94, 59, 0.45);
            color: var(--av-emerald);
          }

          .status-badge.closed {
            background: rgba(115, 121, 85, 0.12);
            border: 1px solid rgba(115, 121, 85, 0.45);
            color: var(--av-olive);
          }

          /* ---------- Back link ---------- */
          .btn-back {
            padding: 8px 18px;
            margin-bottom: 20px;
            border-radius: 999px;
            background: transparent;
            border: 1px solid rgba(146, 121, 27, 0.45);
            font-family: var(--font-body), sans-serif;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: var(--av-bronze);
            cursor: pointer;
            transition:
              background-color 0.25s ease,
              color 0.25s ease;
          }

          .btn-back:hover {
            background: var(--av-bronze);
            color: var(--av-warm);
          }

          .registrants-panel h2,
          .registrant-detail h2 {
            margin: 0 0 16px;
            padding-bottom: 16px;
            font-family: var(--font-heading), serif;
            font-size: 32px;
            font-weight: 600;
            color: var(--av-bronze);
            border-bottom: 1px solid rgba(201, 168, 76, 0.35);
          }

          .payment-note {
            margin: 0 0 20px;
            padding: 12px 16px;
            border-radius: 10px;
            border-left: 3px solid var(--av-gold);
            background: rgba(201, 168, 76, 0.12);
            font-family: var(--font-body), sans-serif;
            font-size: 13px;
            color: var(--av-bronze);
          }

          /* ---------- Registrant names ---------- */
          .registrant-names {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .registrant-row {
            width: 100%;
            padding: 14px 20px;
            text-align: left;
            background: transparent;
            border: none;
            border-bottom: 1px solid rgba(201, 168, 76, 0.28);
            border-radius: 8px;
            font-family: var(--font-body), sans-serif;
            font-size: 15px;
            font-weight: 500;
            color: var(--av-charcoal);
            cursor: pointer;
            transition:
              background-color 0.25s ease,
              padding-left 0.25s ease,
              color 0.25s ease;
          }

          .registrant-row:hover {
            background: rgba(201, 168, 76, 0.14);
            padding-left: 28px;
            color: var(--av-bronze);
          }

          /* ---------- Detail list ---------- */
          .registrant-detail dl {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 0;
            margin: 0;
          }

          .registrant-detail dt {
            padding: 14px 0;
            font-family: var(--font-body), sans-serif;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--av-olive);
            border-bottom: 1px solid rgba(201, 168, 76, 0.22);
          }

          .registrant-detail dd {
            padding: 14px 0;
            margin: 0;
            font-family: var(--font-body), sans-serif;
            font-size: 14px;
            color: var(--av-charcoal);
            word-break: break-word;
            border-bottom: 1px solid rgba(201, 168, 76, 0.22);
          }

          .link-list {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .link-list a {
            color: var(--av-emerald);
            text-decoration: underline;
            text-underline-offset: 3px;
          }

          .link-list a:hover {
            color: var(--av-bronze);
          }

          .payment-image {
            max-width: 320px;
            width: 100%;
            border-radius: 10px;
            border: 1px solid rgba(146, 121, 27, 0.4);
            display: block;
          }

          .payment-missing {
            font-style: italic;
            color: var(--av-crimson);
          }

          @media (prefers-reduced-motion: reduce) {
            .events-list,
            .registrants-panel,
            .registrant-detail {
              animation: none;
            }

            .event-row,
            .registrant-row {
              transition: none;
            }

            .event-row:hover {
              transform: none;
            }

            .registrant-row:hover {
              padding-left: 20px;
            }
          }

          @media (max-width: 768px) {
            .registrants-container {
              padding: 32px 16px 48px;
            }

            .registrants-header {
              padding: 32px 20px 24px;
            }

            .registrants-header h1 {
              font-size: 32px;
            }

            .registrants-tagline {
              font-size: 14px;
            }

            .events-list,
            .registrants-panel,
            .registrant-detail {
              padding: 24px 20px;
            }

            .event-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }

            .registrant-detail dl {
              grid-template-columns: 1fr;
            }

            .registrant-detail dt {
              padding-bottom: 0;
              border-bottom: none;
            }
          }
        `}</style>
      </main>
    </>
  );
}
