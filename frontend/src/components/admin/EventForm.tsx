"use client";

import React, { useState, useEffect } from "react";
import { compressImage, validateImage } from "../../lib/utils/imageOptimizer";

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
  registration_deadline?: string | null;
  payment_image_required?: boolean;
  event_slug?: Array<{
    id: string;
    more_description: string | null;
    image_url: string | null;
  }>;
  posters?: Array<{
    id: string;
    poster_image_url: string;
  }>;
}

interface EventFormProps {
  event?: Event;
  onSubmit: (formData: EventFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export interface EventFormData {
  title: string;
  description: string;
  highlights: string;
  image_url: string;
  date: string;
  venue?: string;
  registration_enabled?: boolean;
  registration_status?: boolean;
  registration_deadline?: string;
  payment_image_required?: boolean;
  more_description?: string;
  slug_image_url?: string;
  poster_image_urls?: string; // pipe-separated for multiple
}

export default function EventForm({
  event,
  onSubmit,
  onCancel,
  isLoading,
}: EventFormProps) {
  const eventSlug = event?.event_slug?.[0];

  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || "",
    description: event?.description || "",
    highlights: event?.highlights || "",
    image_url: event?.image_url || "",
    date: event?.date || "",
    venue: event?.venue || "",
    registration_enabled: event?.registration_enabled ?? true,
    registration_status: event?.registration_status ?? true,
    registration_deadline: event?.registration_deadline || "",
    payment_image_required: event?.payment_image_required ?? false,
    more_description: eventSlug?.more_description || "",
    slug_image_url: eventSlug?.image_url || "",
    poster_image_urls:
      event?.posters?.map((p) => p.poster_image_url).join("|") || "",
  });
  const [imagePreview, setImagePreview] = useState<string>(
    event?.image_url || "",
  );
  const [slugImagePreviews, setSlugImagePreviews] = useState<string[]>(
    eventSlug?.image_url ? eventSlug.image_url.split("|").filter(Boolean) : [],
  );
  const [posterImagePreviews, setPosterImagePreviews] = useState<string[]>(
    event?.posters?.map((p) => p.poster_image_url) || [],
  );
  const [imageError, setImageError] = useState<string>("");
  const [isCompressing, setIsCompressing] = useState(false);

  // Update form data when event prop changes (for editing)
  useEffect(() => {
    if (event) {
      const eventSlug = event?.event_slug?.[0];
      setFormData({
        title: event?.title || "",
        description: event?.description || "",
        highlights: event?.highlights || "",
        image_url: event?.image_url || "",
        date: event?.date || "",
        venue: event?.venue || "",
        registration_enabled: event?.registration_enabled ?? true,
        registration_status: event?.registration_status ?? true,
        registration_deadline: event?.registration_deadline || "",
        payment_image_required: event?.payment_image_required ?? false,
        more_description: eventSlug?.more_description || "",
        slug_image_url: eventSlug?.image_url || "",
        poster_image_urls:
          event?.posters?.map((p) => p.poster_image_url).join("|") || "",
      });
      setImagePreview(event?.image_url || "");
      setSlugImagePreviews(
        eventSlug?.image_url
          ? eventSlug.image_url.split("|").filter(Boolean)
          : [],
      );
      setPosterImagePreviews(
        event?.posters?.map((p) => p.poster_image_url) || [],
      );
    }
  }, [event]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageError("");
      setIsCompressing(true);

      try {
        const validation = validateImage(file, 10);
        if (!validation.valid) {
          setImageError(validation.error || "Invalid image");
          setIsCompressing(false);
          return;
        }

        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.7,
          maxSizeKB: 300,
        });

        setImagePreview(compressed);
        setFormData((prev) => ({
          ...prev,
          image_url: compressed,
        }));
      } catch (error) {
        setImageError(
          error instanceof Error ? error.message : "Failed to process image",
        );
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSlugImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setImageError("");
    setIsCompressing(true);

    try {
      const compressedImages: string[] = [];

      for (const file of files) {
        const validation = validateImage(file, 10);
        if (!validation.valid) {
          throw new Error(validation.error || "Invalid image");
        }

        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.7,
          maxSizeKB: 300,
        });
        compressedImages.push(compressed);
      }

      setSlugImagePreviews((prev) => [...prev, ...compressedImages]);
      setFormData((prev) => ({
        ...prev,
        slug_image_url: [
          ...(prev.slug_image_url?.split("|").filter(Boolean) || []),
          ...compressedImages,
        ].join("|"),
      }));
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Failed to process image",
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const removeSlugImage = (index: number) => {
    setSlugImagePreviews((prev) => prev.filter((_, i) => i !== index));
    const images = formData.slug_image_url?.split("|").filter(Boolean) || [];
    images.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      slug_image_url: images.join("|"),
    }));
  };

  const handlePosterImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setImageError("");
    setIsCompressing(true);

    try {
      const compressedImages: string[] = [];

      for (const file of files) {
        const validation = validateImage(file, 10);
        if (!validation.valid) {
          throw new Error(validation.error || "Invalid image");
        }

        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.7,
          maxSizeKB: 300,
        });
        compressedImages.push(compressed);
      }

      setPosterImagePreviews((prev) => [...prev, ...compressedImages]);
      setFormData((prev) => ({
        ...prev,
        poster_image_urls: [
          ...(prev.poster_image_urls?.split("|").filter(Boolean) || []),
          ...compressedImages,
        ].join("|"),
      }));
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Failed to process image",
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const removePosterImage = (index: number) => {
    setPosterImagePreviews((prev) => prev.filter((_, i) => i !== index));
    const images = formData.poster_image_urls?.split("|").filter(Boolean) || [];
    images.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      poster_image_urls: images.join("|"),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    if (!event) {
      setFormData({
        title: "",
        description: "",
        highlights: "",
        image_url: "",
        date: "",
        venue: "",
        registration_enabled: true,
        registration_status: true,
        registration_deadline: "",
        payment_image_required: false,
        more_description: "",
        slug_image_url: "",
        poster_image_urls: "",
      });
      setImagePreview("");
      setSlugImagePreviews([]);
      setPosterImagePreviews([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <h2>{event ? "Edit Event" : "Create New Event"}</h2>

      {/* Basic Event Info */}
      <div className="form-section">
        <h3>Basic Event Information</h3>

        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Event title"
            required
            disabled={isLoading}
            maxLength={256}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Event description"
            rows={3}
            disabled={isLoading}
            maxLength={2048}
          />
        </div>

        <div className="form-group">
          <label htmlFor="highlights">Highlights</label>
          <textarea
            id="highlights"
            name="highlights"
            value={formData.highlights}
            onChange={handleInputChange}
            placeholder="Add one highlight per line"
            rows={4}
            disabled={isLoading}
            maxLength={2048}
          />
          <p className="help-text">These appear as a short list on the event page.</p>
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Event Cover Image</label>
          <div className="image-upload-group">
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isLoading || isCompressing}
              className="file-input"
            />
            {imageError && <p className="help-text error">{imageError}</p>}
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview("");
                    setFormData((prev) => ({
                      ...prev,
                      image_url: "",
                    }));
                  }}
                  disabled={isLoading || isCompressing}
                  className="btn-remove-image"
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="form-section">
        <h3>Event Details & Information</h3>

        <div className="form-group">
          <label htmlFor="more_description">Detailed Description</label>
          <textarea
            id="more_description"
            name="more_description"
            value={formData.more_description}
            onChange={handleInputChange}
            placeholder="Add detailed event information"
            rows={4}
            disabled={isLoading}
            maxLength={4096}
          />
        </div>

        <div className="form-group">
          <label htmlFor="slug_images">Event Detail Images</label>
          <div className="image-upload-group">
            <input
              id="slug_images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleSlugImageChange}
              disabled={isLoading || isCompressing}
              className="file-input"
            />
            <p className="help-text">
              Upload multiple images for event details
            </p>

            {slugImagePreviews.length > 0 && (
              <div className="slug-images-grid">
                {slugImagePreviews.map((preview, index) => (
                  <div key={index} className="slug-image-card">
                    <img src={preview} alt={`Detail ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeSlugImage(index)}
                      disabled={isLoading || isCompressing}
                      className="btn-remove-slug-image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Settings */}
      <div className="form-section">
        <h3>Registration Settings</h3>

        <div className="form-group">
          <label htmlFor="venue">Event Venue/Location</label>
          <input
            id="venue"
            type="text"
            name="venue"
            value={formData.venue || ""}
            onChange={handleInputChange}
            placeholder="e.g., Main Auditorium, LT-101, Online"
            disabled={isLoading}
            maxLength={256}
          />
        </div>

        <div className="form-group checkbox-group">
          <label htmlFor="registration_status">
            <input
              id="registration_status"
              type="checkbox"
              checked={formData.registration_status ?? true}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  registration_status: e.target.checked,
                }))
              }
              disabled={isLoading}
              className="checkbox-input"
            />
            <span>Registrations open</span>
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="registration_deadline">Registration Deadline</label>
          <input
            id="registration_deadline"
            type="date"
            name="registration_deadline"
            value={formData.registration_deadline || ""}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <p className="field-hint">
            Registration automatically closes after this date. Leave blank for
            no deadline.
          </p>
        </div>

        <div className="form-group checkbox-group">
          <label htmlFor="payment_image_required">
            <input
              id="payment_image_required"
              type="checkbox"
              checked={formData.payment_image_required ?? false}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  payment_image_required: e.target.checked,
                }))
              }
              disabled={isLoading || !formData.registration_enabled}
              className="checkbox-input"
            />
            <span>Require payment proof</span>
          </label>
        </div>
      </div>

      {/* Event Posters */}
      <div className="form-section">
        <h3>Event Posters</h3>

        <div className="form-group">
          <label htmlFor="posters">Poster Images</label>
          <div className="image-upload-group">
            <input
              id="posters"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePosterImageChange}
              disabled={isLoading || isCompressing}
              className="file-input"
            />
            <p className="help-text">
              Upload promotional posters for this event
            </p>

            {posterImagePreviews.length > 0 && (
              <div className="poster-images-grid">
                {posterImagePreviews.map((preview, index) => (
                  <div key={index} className="poster-image-card">
                    <img src={preview} alt={`Poster ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removePosterImage(index)}
                      disabled={isLoading || isCompressing}
                      className="btn-remove-poster-image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={isLoading || isCompressing}
          className="btn-submit"
        >
          {isLoading ? "Saving..." : event ? "Update Event" : "Create Event"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading || isCompressing}
          className="btn-cancel"
        >
          Cancel
        </button>
      </div>

      <style jsx>{`
        /* The parent .form-card already supplies the parchment panel. */
        .event-form {
          padding: 32px;
        }

        h2 {
          margin: 0 0 24px;
          padding-bottom: 16px;
          font-family: var(--font-heading), serif;
          font-size: 28px;
          font-weight: 600;
          color: var(--av-bronze);
          border-bottom: 1px solid rgba(201, 168, 76, 0.35);
        }

        .form-section {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(201, 168, 76, 0.25);
        }

        .form-section:last-of-type {
          border-bottom: none;
          margin-bottom: 16px;
        }

        .form-section h3 {
          margin: 0 0 16px;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--av-olive);
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--av-olive);
        }

        .form-group input[type="text"],
        .form-group input[type="date"],
        .form-group textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid rgba(146, 121, 27, 0.35);
          border-radius: 10px;
          background: #ffffff;
          font-family: var(--font-body), sans-serif;
          font-size: 14px;
          color: var(--av-charcoal);
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .form-group input[type="text"]:focus,
        .form-group input[type="date"]:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--av-gold);
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.25);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 96px;
          line-height: 1.6;
        }

        .form-group input:disabled,
        .form-group textarea:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .field-hint {
          margin: 8px 0 0;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          color: var(--av-olive);
        }

        .checkbox-group {
          padding: 16px;
          border: 1px solid rgba(146, 121, 27, 0.25);
          border-radius: 10px;
          background: rgba(146, 121, 27, 0.05);
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 0;
          font-size: 13px;
          letter-spacing: 0.5px;
          text-transform: none;
          color: var(--av-charcoal);
          cursor: pointer;
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          accent-color: var(--av-bronze);
          cursor: pointer;
          flex-shrink: 0;
        }

        .image-upload-group {
          display: flex;
          flex-direction: column;
        }

        .file-input {
          width: 100%;
          padding: 14px;
          border: 1px dashed rgba(146, 121, 27, 0.5);
          border-radius: 10px;
          background: rgba(146, 121, 27, 0.05);
          font-family: var(--font-body), sans-serif;
          font-size: 13px;
          color: var(--av-charcoal);
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            background-color 0.2s ease;
        }

        .file-input:hover:not(:disabled) {
          border-color: var(--av-gold);
          background: rgba(201, 168, 76, 0.12);
        }

        .file-input:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .help-text {
          margin: 8px 0 0;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          color: var(--av-olive);
        }

        .help-text.error {
          color: var(--av-crimson);
          font-weight: 500;
        }

        .image-preview {
          position: relative;
          margin-top: 16px;
          padding: 16px;
          border: 1px dashed rgba(146, 121, 27, 0.4);
          border-radius: 12px;
          background: rgba(146, 121, 27, 0.05);
        }

        .image-preview img {
          width: 100%;
          max-height: 220px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid rgba(201, 168, 76, 0.5);
          display: block;
        }

        /* ---------- Remove buttons ---------- */
        .btn-remove-image,
        .btn-remove-slug-image,
        .btn-remove-poster-image {
          position: absolute;
          border-radius: 999px;
          border: 1px solid rgba(139, 26, 26, 0.6);
          background: var(--av-warm);
          color: var(--av-crimson);
          line-height: 1;
          cursor: pointer;
          transition:
            background-color 0.25s ease,
            color 0.25s ease;
        }

        /* Labelled pill over the cover preview */
        .btn-remove-image {
          top: 26px;
          right: 26px;
          padding: 7px 14px;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        /* Icon-only discs over the thumbnails */
        .btn-remove-slug-image,
        .btn-remove-poster-image {
          top: 8px;
          right: 8px;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .btn-remove-image:hover:not(:disabled),
        .btn-remove-slug-image:hover:not(:disabled),
        .btn-remove-poster-image:hover:not(:disabled) {
          background: var(--av-crimson);
          color: var(--av-warm);
        }

        .btn-remove-image:disabled,
        .btn-remove-slug-image:disabled,
        .btn-remove-poster-image:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ---------- Image grids ---------- */
        .slug-images-grid,
        .poster-images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .slug-image-card,
        .poster-image-card {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(146, 121, 27, 0.35);
        }

        .slug-image-card img,
        .poster-image-card img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          display: block;
        }

        /* ---------- Actions ---------- */
        .form-actions {
          display: flex;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid rgba(201, 168, 76, 0.35);
        }

        .btn-submit,
        .btn-cancel {
          flex: 1;
          padding: 14px 24px;
          border-radius: 999px;
          border: 1px solid transparent;
          font-family: var(--font-body), sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            background-color 0.25s ease,
            color 0.25s ease;
        }

        .btn-submit {
          background: var(--av-bronze);
          color: var(--av-warm);
        }

        .btn-submit:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 8px 28px rgba(146, 121, 27, 0.4);
        }

        .btn-cancel {
          background: transparent;
          border-color: rgba(115, 121, 85, 0.6);
          color: var(--av-olive);
        }

        .btn-cancel:hover:not(:disabled) {
          background: rgba(115, 121, 85, 0.15);
          color: var(--av-charcoal);
        }

        .btn-submit:disabled,
        .btn-cancel:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (prefers-reduced-motion: reduce) {
          .btn-submit {
            transition: none;
          }

          .btn-submit:hover:not(:disabled) {
            transform: none;
          }
        }

        @media (max-width: 768px) {
          .event-form {
            padding: 24px 20px;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </form>
  );
}
