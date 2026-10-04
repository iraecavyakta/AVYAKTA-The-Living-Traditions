"use client";

import React, { useState } from "react";
import { compressImage, validateImage } from "../../lib/utils/imageOptimizer";

interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string | null;
  registration_enabled?: boolean;
  payment_image_required?: boolean;
  event_slug?: Array<{
    id: string;
    more_description: string | null;
    image_url: string | null;
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
  image_url: string;
  date: string;
  registration_enabled?: boolean;
  payment_image_required?: boolean;
  more_description?: string;
  slug_image_url?: string;
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
    image_url: event?.image_url || "",
    date: event?.date || "",
    registration_enabled: event?.registration_enabled ?? true,
    payment_image_required: event?.payment_image_required ?? false,
    more_description: eventSlug?.more_description || "",
    slug_image_url: eventSlug?.image_url || "",
  });
  const [imagePreview, setImagePreview] = useState<string>(
    event?.image_url || "",
  );
  const [slugImagePreviews, setSlugImagePreviews] = useState<string[]>(
    eventSlug?.image_url ? eventSlug.image_url.split("|").filter(Boolean) : [],
  );
  const [imageError, setImageError] = useState<string>("");
  const [isCompressing, setIsCompressing] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    if (!event) {
      setFormData({
        title: "",
        description: "",
        image_url: "",
        date: "",
        registration_enabled: true,
        payment_image_required: false,
        more_description: "",
        slug_image_url: "",
      });
      setImagePreview("");
      setSlugImagePreviews([]);
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
            {imageError && (
              <p className="help-text" style={{ color: "#dc2626" }}>
                {imageError}
              </p>
            )}
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

        <div className="form-group checkbox-group">
          <label htmlFor="registration_enabled">
            <input
              id="registration_enabled"
              type="checkbox"
              checked={formData.registration_enabled ?? true}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  registration_enabled: e.target.checked,
                }))
              }
              disabled={isLoading}
              className="checkbox-input"
            />
            <span>Enable Registration for this Event</span>
          </label>
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
            <span>Require Payment Proof</span>
          </label>
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
        .event-form {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          max-height: 90vh;
          overflow-y: auto;
        }

        h2 {
          margin: 0 0 24px 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .form-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-section:last-of-type {
          border-bottom: none;
        }

        .form-section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input[type="text"],
        .form-group input[type="date"],
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-group input:disabled,
        .form-group textarea:disabled {
          background-color: #f3f4f6;
          color: #9ca3af;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 0;
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .image-upload-group {
          border: 2px dashed #d1d5db;
          border-radius: 6px;
          padding: 16px;
          background: #f9fafb;
        }

        .file-input {
          display: block;
          width: 100%;
          margin-bottom: 8px;
        }

        .help-text {
          margin: 8px 0 0 0;
          font-size: 12px;
          color: #6b7280;
        }

        .image-preview {
          margin-top: 12px;
          position: relative;
          width: fit-content;
        }

        .image-preview img {
          width: 200px;
          height: 150px;
          object-fit: cover;
          border-radius: 4px;
        }

        .btn-remove-image {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 3px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
        }

        .slug-images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .slug-image-card {
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          background: #f3f4f6;
        }

        .slug-image-card img {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }

        .btn-remove-slug-image {
          position: absolute;
          top: 2px;
          right: 2px;
          background: rgba(220, 38, 38, 0.9);
          color: white;
          border: none;
          border-radius: 2px;
          padding: 2px 6px;
          font-size: 11px;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-submit,
        .btn-cancel {
          flex: 1;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-submit {
          background-color: #3b82f6;
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-cancel {
          background-color: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-cancel:hover:not(:disabled) {
          background-color: #e5e7eb;
        }

        .btn-submit:disabled,
        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}
