"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isRegistrationOpen } from "@/lib/utils/events";

interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string | null;
  venue?: string | null;
  registration_status?: boolean;
  registration_deadline?: string | null;
}

export default function RegistrationAvailableClient() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

      // Filter only events with open registration (status + deadline)
      const openEvents = (result.data || []).filter((event: Event) =>
        isRegistrationOpen(event),
      );

      setEvents(openEvents);
      setError("");
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (isLoading) {
    return (
      <main className="registrations-page-container">
        <div className="registrations-wrapper">
          <p className="loading">Loading available registrations...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="registrations-page-container">
        <div className="registrations-wrapper">
          <div className="alert alert-error">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="registrations-page-container">
      <div className="registrations-wrapper">
        <div className="registrations-page-header">
          <h1>📝 Event Registrations</h1>
          <p>Register for events that are currently open for registrations</p>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            <p>
              No events with open registrations at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <div className="registrations-grid">
            {events.map((event) => (
              <div key={event.id} className="registration-card">
                {event.image_url && (
                  <div className="registration-image">
                    <img src={event.image_url} alt={event.title} />
                    <div className="registration-status-badge">
                      ✅ Registration Open
                    </div>
                  </div>
                )}

                <div className="registration-content">
                  <h3>{event.title}</h3>

                  {event.date && (
                    <p className="registration-date">
                      📅{" "}
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}

                  {event.venue && (
                    <p className="registration-venue">📍 {event.venue}</p>
                  )}

                  {event.registration_deadline && (
                    <p className="registration-deadline">
                      ⏳ Register by{" "}
                      {new Date(event.registration_deadline).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                  )}

                  {event.description && (
                    <p className="registration-description">
                      {event.description}
                    </p>
                  )}

                  <div className="registration-actions">
                    <Link href={`/events/${event.id}`} className="btn-register">
                      View & Register
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .registrations-page-container {
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(
            135deg,
            #f0f4f8 0%,
            #f5f0e8 50%,
            #f0f4f8 100%
          );
        }

        .registrations-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }

        .registrations-page-header {
          margin-bottom: 32px;
        }

        .registrations-page-header h1 {
          margin: 0 0 8px 0;
          font-size: 36px;
          font-weight: 700;
          color: #1f2937;
        }

        .registrations-page-header p {
          margin: 0;
          font-size: 16px;
          color: #6b7280;
        }

        .empty-state {
          text-align: center;
          padding: 48px 20px;
          background: white;
          border-radius: 8px;
          color: #6b7280;
        }

        .registrations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .registration-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .registration-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
          transform: translateY(-4px);
        }

        .registration-image {
          width: 100%;
          height: 220px;
          overflow: hidden;
          background: #f3f4f6;
          position: relative;
        }

        .registration-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .registration-status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #10b981;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .registration-content {
          padding: 16px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .registration-content h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .registration-date,
        .registration-venue,
        .registration-deadline {
          margin: 4px 0;
          font-size: 13px;
          color: #6b7280;
        }

        .registration-deadline {
          color: #92400e;
          font-weight: 600;
        }

        .registration-description {
          margin: 8px 0;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
          flex-grow: 1;
        }

        .registration-actions {
          margin-top: 16px;
          display: flex;
          gap: 8px;
        }

        .btn-register {
          flex-grow: 1;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          border-radius: 4px;
          background: #10b981;
          color: white;
          cursor: pointer;
          text-decoration: none;
          text-align: center;
          transition: all 0.2s ease;
        }

        .btn-register:hover {
          background: #059669;
          transform: scale(1.02);
        }

        .loading {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .alert-error {
          padding: 12px 16px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .registrations-grid {
            grid-template-columns: 1fr;
          }

          .registrations-page-header h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </main>
  );
}
