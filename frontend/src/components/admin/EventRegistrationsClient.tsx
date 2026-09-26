"use client";

import { useEffect, useState } from "react";
import {
  isRegistrationOpen,
  isRegistrationDeadlinePassed,
} from "@/lib/utils/events";
import DashboardPageBackground from "../layout/DashboardPageBackground";
import registrationsBackground from "../../../Admin_Dash_Img/3.png";

interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string | null;
  venue?: string | null;
  registration_enabled?: boolean;
  registration_status?: boolean;
  registration_deadline?: string | null;
}

export default function EventRegistrationsClient() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [reopeningEventId, setReopeningEventId] = useState<string | null>(null);
  const [newDeadlineDraft, setNewDeadlineDraft] = useState("");

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/events?ts=" + Date.now(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to fetch events");

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch events");

      setEvents(result.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setIsLoading(false);
    }
  };

  const submitToggle = async (
    event: Event,
    payload: { registration_status: boolean; registration_deadline?: string },
  ) => {
    try {
      setTogglingId(event.id);

      const response = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to toggle registration");
      }

      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, ...payload } : e)),
      );

      setSuccessMessage(
        `Registration ${payload.registration_status ? "opened" : "closed"} for ${event.title}`,
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle registration",
      );
      setTimeout(() => setError(""), 3000);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCloseRegistration = (event: Event) => {
    submitToggle(event, { registration_status: false });
  };

  const handleOpenRegistration = (event: Event) => {
    if (isRegistrationDeadlinePassed(event.registration_deadline)) {
      setReopeningEventId(event.id);
      setNewDeadlineDraft("");
      return;
    }

    submitToggle(event, { registration_status: true });
  };

  const handleConfirmReopen = (event: Event) => {
    if (!newDeadlineDraft) {
      setError("Please choose a new registration deadline");
      setTimeout(() => setError(""), 3000);
      return;
    }

    submitToggle(event, {
      registration_status: true,
      registration_deadline: newDeadlineDraft,
    });
    setReopeningEventId(null);
    setNewDeadlineDraft("");
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <>
      <DashboardPageBackground src={registrationsBackground.src} />

      <main className="registrations-container">
        <div className="registrations-wrapper">
          <header className="registrations-header">
            <span className="corner corner-tl" aria-hidden />
            <span className="corner corner-br" aria-hidden />

            <p className="registrations-label">Avyakta Admin</p>
            <h1>Registration Management</h1>
            <p className="registrations-tagline">
              Open or close registrations for each event.
            </p>

            <div className="rangoli" aria-hidden>
              <span className="dot small" />
              <span className="dot large" />
              <span className="dot small" />
            </div>
          </header>

          {error && <div className="alert alert-error">{error}</div>}
          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}

          <div className="events-table">
            {isLoading ? (
              <p className="loading">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="empty-state">No events found</p>
            ) : (
              <div className="table-wrapper">
                <table className="events-list-table">
                  <thead>
                    <tr>
                      <th>Event Title</th>
                      <th>Date</th>
                      <th>Venue</th>
                      <th>Deadline</th>
                      <th>Registration Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => {
                      const open = isRegistrationOpen(event);
                      const deadlinePassed = isRegistrationDeadlinePassed(
                        event.registration_deadline,
                      );
                      const isReopening = reopeningEventId === event.id;

                      return (
                        <tr
                          key={event.id}
                          className={open ? "enabled" : "disabled"}
                        >
                          <td className="event-title">{event.title}</td>
                          <td className="event-date">
                            {event.date
                              ? new Date(event.date).toLocaleDateString()
                              : "No date"}
                          </td>
                          <td className="event-venue">
                            {event.venue || "TBA"}
                          </td>
                          <td className="event-deadline">
                            {event.registration_deadline
                              ? new Date(
                                  event.registration_deadline,
                                ).toLocaleDateString()
                              : "No deadline"}
                            {deadlinePassed && (
                              <span className="deadline-passed"> (passed)</span>
                            )}
                          </td>
                          <td className="event-status">
                            <span
                              className={`status-badge ${open ? "open" : "closed"}`}
                            >
                              {open ? "Open" : "Closed"}
                            </span>
                          </td>
                          <td className="event-action">
                            {isReopening ? (
                              <div className="reopen-form">
                                <input
                                  type="date"
                                  value={newDeadlineDraft}
                                  onChange={(e) =>
                                    setNewDeadlineDraft(e.target.value)
                                  }
                                  className="deadline-input"
                                />
                                <button
                                  onClick={() => handleConfirmReopen(event)}
                                  disabled={togglingId === event.id}
                                  className="btn-toggle enable"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setReopeningEventId(null)}
                                  className="btn-toggle disable"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  open
                                    ? handleCloseRegistration(event)
                                    : handleOpenRegistration(event)
                                }
                                disabled={togglingId === event.id}
                                className={`btn-toggle ${open ? "disable" : "enable"}`}
                              >
                                {togglingId === event.id
                                  ? "..."
                                  : open
                                    ? "Close"
                                    : "Open"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .registrations-container {
            position: relative;
            z-index: 1;
            min-height: 100vh;
            padding: 48px 24px 64px;
          }

          .registrations-wrapper {
            max-width: 1200px;
            margin: 0 auto;
          }

          /* ---------- Header ---------- */
          .registrations-header {
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

          .registrations-label {
            margin: 0;
            font-family: var(--font-body), sans-serif;
            font-size: 11px;
            font-weight: 600;
            color: var(--av-olive);
            letter-spacing: 5px;
            text-transform: uppercase;
          }

          .registrations-header h1 {
            margin: 12px 0 8px;
            font-family: var(--font-heading), serif;
            font-size: 44px;
            font-weight: 600;
            color: var(--av-bronze);
            letter-spacing: 0.5px;
          }

          .registrations-tagline {
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

          .alert-success {
            background: var(--av-warm);
            color: var(--av-emerald);
            border: 1px solid rgba(27, 94, 59, 0.45);
            border-left: 4px solid var(--av-emerald);
          }

          /* ---------- Table panel ---------- */
          .events-table {
            position: relative;
            background: var(--av-warm);
            border: 1px solid rgba(146, 121, 27, 0.3);
            border-radius: 16px;
            box-shadow: 0 16px 40px rgba(28, 28, 28, 0.35);
            overflow: hidden;
          }

          /* Gold accent along the top edge */
          .events-table::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(
              90deg,
              transparent,
              var(--av-gold),
              transparent
            );
            z-index: 2;
          }

          .loading,
          .empty-state {
            padding: 56px 24px;
            text-align: center;
            font-family: var(--font-accent), serif;
            font-style: italic;
            font-size: 15px;
            color: var(--av-olive);
          }

          .table-wrapper {
            overflow-x: auto;
          }

          .events-list-table {
            width: 100%;
            border-collapse: collapse;
          }

          .events-list-table th {
            padding: 18px 20px;
            text-align: left;
            font-family: var(--font-body), sans-serif;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--av-olive);
            background: rgba(146, 121, 27, 0.08);
            border-bottom: 1px solid rgba(201, 168, 76, 0.4);
            white-space: nowrap;
          }

          .events-list-table td {
            padding: 18px 20px;
            font-family: var(--font-body), sans-serif;
            font-size: 14px;
            color: var(--av-charcoal);
            border-bottom: 1px solid rgba(201, 168, 76, 0.22);
            vertical-align: middle;
          }

          .events-list-table tbody tr {
            transition: background-color 0.25s ease;
          }

          .events-list-table tbody tr:hover {
            background: rgba(201, 168, 76, 0.1);
          }

          .events-list-table tbody tr:last-child td {
            border-bottom: none;
          }

          /* A quiet left rail marks open vs closed without adding new colours */
          .events-list-table tbody tr.enabled td:first-child {
            box-shadow: inset 3px 0 0 var(--av-emerald);
          }

          .events-list-table tbody tr.disabled td:first-child {
            box-shadow: inset 3px 0 0 rgba(115, 121, 85, 0.6);
          }

          /* Qualified with the table so it outranks the .events-list-table td
             rule, which otherwise forces the body font back onto the cell. */
          .events-list-table td.event-title {
            font-family: var(--font-heading), serif;
            font-size: 18px;
            font-weight: 600;
            color: var(--av-charcoal);
          }

          .event-date,
          .event-deadline {
            font-variant-numeric: lining-nums tabular-nums;
            white-space: nowrap;
          }

          .events-list-table td.event-venue {
            color: rgba(28, 28, 28, 0.7);
          }

          .deadline-passed {
            color: var(--av-crimson);
            font-style: italic;
            font-size: 12px;
          }

          .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            white-space: nowrap;
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

          /* ---------- Toggle actions ---------- */
          .btn-toggle {
            padding: 9px 20px;
            border-radius: 999px;
            background: transparent;
            font-family: var(--font-body), sans-serif;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            cursor: pointer;
            white-space: nowrap;
            transition:
              transform 0.25s ease,
              background-color 0.25s ease,
              color 0.25s ease,
              box-shadow 0.25s ease;
          }

          .btn-toggle.enable {
            border: 1px solid rgba(27, 94, 59, 0.6);
            color: var(--av-emerald);
          }

          .btn-toggle.enable:hover:not(:disabled) {
            transform: scale(1.03);
            background: var(--av-emerald);
            color: var(--av-warm);
            box-shadow: 0 6px 20px rgba(27, 94, 59, 0.3);
          }

          .btn-toggle.disable {
            border: 1px solid rgba(139, 26, 26, 0.6);
            color: var(--av-crimson);
          }

          .btn-toggle.disable:hover:not(:disabled) {
            transform: scale(1.03);
            background: var(--av-crimson);
            color: var(--av-warm);
            box-shadow: 0 6px 20px rgba(139, 26, 26, 0.3);
          }

          .btn-toggle:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* ---------- Reopen form ---------- */
          .reopen-form {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .deadline-input {
            padding: 9px 12px;
            border: 1px solid rgba(146, 121, 27, 0.35);
            border-radius: 10px;
            background: #ffffff;
            font-family: var(--font-body), sans-serif;
            font-size: 13px;
            font-variant-numeric: lining-nums tabular-nums;
            color: var(--av-charcoal);
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .deadline-input:focus {
            outline: none;
            border-color: var(--av-gold);
            box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.25);
          }

          @media (prefers-reduced-motion: reduce) {
            .btn-toggle,
            .events-list-table tbody tr {
              transition: none;
            }

            .btn-toggle:hover:not(:disabled) {
              transform: none;
            }
          }

          @media (max-width: 768px) {
            .registrations-container {
              padding: 32px 16px 48px;
            }

            .registrations-header {
              padding: 32px 20px 24px;
            }

            .registrations-header h1 {
              font-size: 30px;
            }

            .registrations-tagline {
              font-size: 14px;
            }

            .events-list-table th,
            .events-list-table td {
              padding: 14px;
            }

            .event-title {
              font-size: 16px;
            }
          }
        `}</style>
      </main>
    </>
  );
}
