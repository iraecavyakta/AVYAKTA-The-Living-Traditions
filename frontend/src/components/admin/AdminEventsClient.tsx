"use client";

import { useEffect, useState } from "react";
import EventForm, { EventFormData } from "./EventForm";
import DashboardPageBackground from "../layout/DashboardPageBackground";
import eventsBackground from "../../../Admin_Dash_Img/2.png";

interface EventSlug {
  id: string;
  event_id: string;
  more_description: string | null;
  image_url: string | null;
}

interface Poster {
  id: string;
  event_id: string;
  poster_image_url: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  highlights?: string | null;
  image_url: string | null;
  date: string | null;
  venue?: string | null;
  registration_enabled?: boolean;
  registration_status?: boolean;
  payment_image_required?: boolean;
  event_slug?: EventSlug[];
  posters?: Poster[];
}

export default function AdminEventsClient() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch all events
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

      const filteredEvents = (result.data || []).filter(
        (e: { id?: string }) => e?.id,
      );
      setEvents(filteredEvents);
      setError("");
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (formData: EventFormData) => {
    try {
      setIsSubmitting(true);
      setError("");

      if (editingEvent) {
        // Update event
        const response = await fetch(`/api/events/${editingEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.error || `HTTP error! status: ${response.status}`,
          );
        }
        if (!result.success) {
          throw new Error(result.error || "Failed to update event");
        }

        setEvents((prev) =>
          prev
            .map((e) => (e?.id === editingEvent.id ? result.data : e))
            .filter((e) => e?.id),
        );
        setSelectedEvent(result.data);
        setSuccessMessage("Event updated successfully");
        setEditingEvent(null);
      } else {
        // Create new event
        const payload = {
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim(),
        };

        const response = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.error || `HTTP error! status: ${response.status}`,
          );
        }
        if (!result.success) {
          throw new Error(result.error || "Failed to create event");
        }

        setEvents((prev) => [result.data, ...prev]);
        setSelectedEvent(result.data);
        setSuccessMessage("Event created successfully");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      setIsDeletingId(id);
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete event");
      }

      setEvents((prev) => prev.filter((e) => e?.id !== id));
      if (selectedEvent?.id === id) {
        setSelectedEvent(null);
      }
      if (editingEvent?.id === id) {
        setEditingEvent(null);
      }

      setSuccessMessage("Event deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setIsDeletingId(null);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingEvent(null);
  };

  // Handle edit
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setSelectedEvent(event);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <>
      <DashboardPageBackground src={eventsBackground.src} />

      <main className="events-admin-container">
        <div className="events-admin-wrapper">
          <header className="events-admin-header">
            <span className="corner corner-tl" aria-hidden />
            <span className="corner corner-br" aria-hidden />

            <p className="events-admin-label">Avyakta Admin</p>
            <h1>Events Management</h1>
            <p className="events-admin-tagline">
              Create and manage events with details, images, and registration
              settings.
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

          <div className="events-admin-layout">
            {/* Left: Form */}
            <div className="events-admin-form-section">
              <div className="form-card">
                <EventForm
                  key={editingEvent?.id ?? "new"}
                  event={editingEvent || undefined}
                  onSubmit={handleFormSubmit}
                  onCancel={handleCancel}
                  isLoading={isSubmitting}
                />
              </div>
            </div>

            {/* Right: Events List */}
            <div className="events-admin-list-section">
              <div className="list-card">
                <div className="list-header">
                  <h2>Events List</h2>
                  <span className="event-count">{events.length}</span>
                </div>

                {isLoading ? (
                  <p className="loading">Loading events...</p>
                ) : events.length === 0 ? (
                  <p className="empty-state">
                    No events created yet. Create one using the form.
                  </p>
                ) : (
                  <div className="events-admin-item-list">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`events-admin-item ${selectedEvent?.id === event.id ? "selected" : ""}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="events-admin-item-content">
                          <h4>{event.title}</h4>
                          <p className="event-date">
                            {event.date
                              ? new Date(event.date).toLocaleDateString()
                              : "No date"}
                          </p>
                          <p className="event-desc">
                            {event.description
                              ? event.description.substring(0, 60) + "..."
                              : "No description"}
                          </p>
                        </div>

                        <div className="events-admin-item-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditEvent(event)}
                            disabled={editingEvent?.id === event.id}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={isDeletingId === event.id}
                          >
                            {isDeletingId === event.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            {selectedEvent && !editingEvent && (
              <div className="events-details-section">
                <div className="details-card">
                  <div className="details-header">
                    <h2>Event Details</h2>
                    <button
                      className="btn-close-details"
                      onClick={() => setSelectedEvent(null)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="details-content">
                    {/* Basic Info */}
                    <div className="detail-section">
                      <h3>Basic Information</h3>
                      <div className="detail-item">
                        <label>Title:</label>
                        <p>{selectedEvent.title}</p>
                      </div>
                      <div className="detail-item">
                        <label>Description:</label>
                        <p>{selectedEvent.description || "No description"}</p>
                      </div>
                      <div className="detail-item">
                        <label>Date:</label>
                        <p>
                          {selectedEvent.date
                            ? new Date(selectedEvent.date).toLocaleDateString()
                            : "No date set"}
                        </p>
                      </div>
                    </div>

                    {/* Cover Image */}
                    {selectedEvent.image_url && (
                      <div className="detail-section">
                        <h3>Cover Image</h3>
                        <img
                          src={selectedEvent.image_url}
                          alt={selectedEvent.title}
                          className="detail-image-preview"
                        />
                      </div>
                    )}

                    {/* Event Details (Slug) */}
                    {selectedEvent.event_slug &&
                      selectedEvent.event_slug.length > 0 && (
                        <div className="detail-section">
                          <h3>Event Details</h3>
                          {selectedEvent.event_slug.map((slug) => (
                            <div key={slug.id}>
                              <div className="detail-item">
                                <label>More Description:</label>
                                <p>
                                  {slug.more_description ||
                                    "No additional description"}
                                </p>
                              </div>
                              {slug.image_url && (
                                <div className="detail-item">
                                  <label>Detail Images:</label>
                                  <div className="image-grid">
                                    {slug.image_url
                                      .split("|")
                                      .map((url, idx) => (
                                        <img
                                          key={idx}
                                          src={url.trim()}
                                          alt={`Detail ${idx + 1}`}
                                          className="detail-grid-image"
                                        />
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Posters */}
                    {selectedEvent.posters &&
                      selectedEvent.posters.length > 0 && (
                        <div className="detail-section">
                          <h3>Posters ({selectedEvent.posters.length})</h3>
                          <div className="image-grid">
                            {selectedEvent.posters.map((poster) => (
                              <img
                                key={poster.id}
                                src={poster.poster_image_url}
                                alt="Poster"
                                className="detail-grid-image"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Action Buttons */}
                    <div className="detail-actions">
                      <button
                        className="btn-edit-detail"
                        onClick={() => handleEditEvent(selectedEvent)}
                      >
                        Edit Event
                      </button>
                      <button
                        className="btn-delete-detail"
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                        disabled={isDeletingId === selectedEvent.id}
                      >
                        {isDeletingId === selectedEvent.id
                          ? "Deleting..."
                          : "Delete Event"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .events-admin-container {
            position: relative;
            z-index: 1;
            min-height: 100vh;
            padding: 48px 24px 64px;
          }

          .events-admin-wrapper {
            max-width: 1600px;
            margin: 0 auto;
          }

          /* ---------- Header ---------- */
          .events-admin-header {
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

          .events-admin-label {
            margin: 0;
            font-family: var(--font-body), sans-serif;
            font-size: 11px;
            font-weight: 600;
            color: var(--av-olive);
            letter-spacing: 5px;
            text-transform: uppercase;
          }

          .events-admin-header h1 {
            margin: 12px 0 8px;
            font-family: var(--font-heading), serif;
            font-size: 44px;
            font-weight: 600;
            color: var(--av-bronze);
            letter-spacing: 0.5px;
          }

          .events-admin-tagline {
            margin: 0;
            font-family: var(--font-accent), serif;
            font-style: italic;
            font-size: 16px;
            color: rgba(28, 28, 28, 0.7);
          }

          /* Rangoli dot divider */
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

          /* ---------- Layout ---------- */
          .events-admin-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            align-items: start;
          }

          .events-admin-form-section,
          .events-admin-list-section {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          /* Shared panel treatment: warm parchment over the dark artwork */
          .form-card,
          .list-card,
          .details-card {
            position: relative;
            background: var(--av-warm);
            border: 1px solid rgba(146, 121, 27, 0.3);
            border-radius: 16px;
            box-shadow: 0 16px 40px rgba(28, 28, 28, 0.35);
            overflow: hidden;
          }

          /* Gold accent along the top edge */
          .form-card::before,
          .list-card::before,
          .details-card::before {
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

          .list-card {
            display: flex;
            flex-direction: column;
          }

          .list-header,
          .details-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 24px;
            border-bottom: 1px solid rgba(201, 168, 76, 0.35);
          }

          .list-header h2,
          .details-header h2 {
            margin: 0;
            font-family: var(--font-heading), serif;
            font-size: 26px;
            font-weight: 600;
            color: var(--av-bronze);
          }

          .event-count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 24px;
            padding: 0 8px;
            border-radius: 999px;
            background: rgba(146, 121, 27, 0.12);
            border: 1px solid rgba(146, 121, 27, 0.3);
            font-family: var(--font-body), sans-serif;
            font-size: 12px;
            font-weight: 600;
            font-variant-numeric: lining-nums tabular-nums;
            color: var(--av-olive);
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

          /* ---------- Event list ---------- */
          .events-admin-item-list {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
            max-height: 720px;
          }

          .events-admin-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            padding: 16px;
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

          .events-admin-item:hover {
            transform: scale(1.02);
            background: rgba(146, 121, 27, 0.12);
            border-color: rgba(201, 168, 76, 0.55);
            box-shadow: 0 8px 24px rgba(201, 168, 76, 0.22);
          }

          .events-admin-item.selected {
            background: rgba(146, 121, 27, 0.14);
            border-color: rgba(146, 121, 27, 0.4);
            border-left-color: var(--av-bronze);
          }

          .events-admin-item-content {
            flex: 1;
            min-width: 0;
          }

          .events-admin-item-content h4 {
            margin: 0 0 6px 0;
            font-family: var(--font-heading), serif;
            font-size: 19px;
            font-weight: 600;
            color: var(--av-charcoal);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .event-date {
            margin: 0 0 4px 0;
            font-family: var(--font-body), sans-serif;
            font-size: 12px;
            font-variant-numeric: lining-nums tabular-nums;
            color: var(--av-olive);
          }

          .event-desc {
            margin: 0;
            font-family: var(--font-body), sans-serif;
            font-size: 12px;
            color: rgba(28, 28, 28, 0.55);
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
          }

          .events-admin-item-actions {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
          }

          .btn-edit,
          .btn-delete {
            padding: 6px 14px;
            border-radius: 999px;
            background: transparent;
            font-family: var(--font-body), sans-serif;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            cursor: pointer;
            transition:
              background-color 0.25s ease,
              color 0.25s ease;
          }

          .btn-edit {
            border: 1px solid rgba(146, 121, 27, 0.5);
            color: var(--av-bronze);
          }

          .btn-edit:hover:not(:disabled) {
            background: var(--av-bronze);
            color: var(--av-warm);
          }

          .btn-delete {
            border: 1px solid rgba(139, 26, 26, 0.5);
            color: var(--av-crimson);
          }

          .btn-delete:hover:not(:disabled) {
            background: var(--av-crimson);
            color: var(--av-warm);
          }

          .btn-edit:disabled,
          .btn-delete:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          /* ---------- Detail panel ---------- */
          .events-details-section {
            grid-column: 1 / -1;
            min-width: 0;
          }

          .btn-close-details {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: transparent;
            border: 1px solid rgba(146, 121, 27, 0.4);
            color: var(--av-olive);
            font-size: 14px;
            cursor: pointer;
            flex-shrink: 0;
            transition:
              background-color 0.25s ease,
              color 0.25s ease;
          }

          .btn-close-details:hover {
            background: var(--av-crimson);
            border-color: var(--av-crimson);
            color: var(--av-warm);
          }

          .details-content {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .detail-section {
            border-bottom: 1px solid rgba(201, 168, 76, 0.28);
            padding-bottom: 16px;
          }

          .detail-section:last-of-type {
            border-bottom: none;
          }

          .detail-section h3 {
            margin: 0 0 16px 0;
            font-family: var(--font-body), sans-serif;
            font-size: 11px;
            font-weight: 600;
            color: var(--av-olive);
            text-transform: uppercase;
            letter-spacing: 2px;
          }

          .detail-item {
            margin-bottom: 16px;
          }

          .detail-item label {
            display: block;
            font-family: var(--font-body), sans-serif;
            font-size: 10px;
            font-weight: 600;
            color: var(--av-olive);
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }

          .detail-item p {
            margin: 0;
            font-family: var(--font-body), sans-serif;
            font-size: 14px;
            color: var(--av-charcoal);
            line-height: 1.6;
            word-break: break-word;
          }

          .detail-image-preview {
            width: 100%;
            max-height: 300px;
            object-fit: cover;
            border-radius: 12px;
            border: 1px solid rgba(146, 121, 27, 0.35);
          }

          .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 8px;
            margin-top: 8px;
          }

          .detail-grid-image {
            width: 100%;
            height: 120px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid rgba(146, 121, 27, 0.35);
            cursor: pointer;
            transition:
              transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.25s ease;
          }

          .detail-grid-image:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 24px rgba(201, 168, 76, 0.35);
          }

          .detail-actions {
            display: flex;
            gap: 16px;
            padding-top: 16px;
            border-top: 1px solid rgba(201, 168, 76, 0.28);
          }

          .btn-edit-detail,
          .btn-delete-detail {
            flex: 1;
            padding: 12px 16px;
            border-radius: 999px;
            border: 1px solid transparent;
            font-family: var(--font-body), sans-serif;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            cursor: pointer;
            transition:
              transform 0.25s ease,
              box-shadow 0.25s ease,
              background-color 0.25s ease;
          }

          .btn-edit-detail {
            background: var(--av-bronze);
            color: var(--av-warm);
          }

          .btn-edit-detail:hover {
            transform: scale(1.03);
            box-shadow: 0 8px 24px rgba(146, 121, 27, 0.4);
          }

          .btn-delete-detail {
            background: transparent;
            border-color: rgba(139, 26, 26, 0.6);
            color: var(--av-crimson);
          }

          .btn-delete-detail:hover:not(:disabled) {
            background: var(--av-crimson);
            color: var(--av-warm);
          }

          .btn-delete-detail:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          @media (prefers-reduced-motion: reduce) {
            .events-admin-item,
            .detail-grid-image,
            .btn-edit-detail {
              transition: none;
            }

            .events-admin-item:hover,
            .detail-grid-image:hover,
            .btn-edit-detail:hover {
              transform: none;
            }
          }

          @media (max-width: 1200px) {
            .events-admin-layout {
              grid-template-columns: 1fr;
              gap: 24px;
            }

            .events-details-section {
            }
          }

          @media (max-width: 768px) {
            .events-admin-container {
              padding: 32px 16px 48px;
            }

            .events-admin-header {
              padding: 32px 20px 24px;
            }

            .events-admin-header h1 {
              font-size: 32px;
            }

            .events-admin-tagline {
              font-size: 14px;
            }

            .events-admin-item-list {
              max-height: 420px;
            }

            .detail-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </main>
    </>
  );
}
