"use client";

import React, { useState, useEffect } from "react";
import { compressImage, validateImage } from "../../lib/utils/imageOptimizer";
import { uploadMultipleImages } from "../../lib/utils/imageUploader";

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
  image_url: string | null;
  date: string | null;
  venue?: string | null;
  registration_enabled?: boolean;
  registration_status?: boolean;
  payment_image_required?: boolean;
  event_slug?: EventSlug[];
  posters?: Poster[];
}

interface EventDetailsPanelProps {
  event: Event;
  onAddSlug: (slug: Omit<EventSlug, "id" | "event_id">) => Promise<void>;
  onUpdateSlug: (slugId: string, data: Partial<EventSlug>) => Promise<void>;
  onDeleteSlug: (slugId: string) => Promise<void>;
  onAddPoster: (poster: Omit<Poster, "id" | "event_id">) => Promise<void>;
  onUpdatePoster: (posterId: string, data: Partial<Poster>) => Promise<void>;
  onDeletePoster: (posterId: string) => Promise<void>;
  onToggleRegistration?: (event: Event, e: React.MouseEvent) => void;
  isLoading: boolean;
}

export default function EventDetailsPanel({
  event,
  onAddSlug,
  onUpdateSlug,
  onDeleteSlug,
  onAddPoster,
  onUpdatePoster,
  onDeletePoster,
  onToggleRegistration,
  isLoading,
}: EventDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"slugs" | "posters">("slugs");
  const [registrationToggling, setRegistrationToggling] = useState(false);
  const [slugFormData, setSlugFormData] = useState({
    more_description: "",
    image_url: "", // Main image URL (will store URLs separated by comma for multiple)
  });
  const [posterFormData, setPosterFormData] = useState({
    poster_image_url: "",
  });
  const [editingSlugId, setEditingSlugId] = useState<string | null>(null);
  const [editingPosterId, setEditingPosterId] = useState<string | null>(null);
  const [slugImagePreviews, setSlugImagePreviews] = useState<string[]>([]);
  const [posterImagePreview, setPosterImagePreview] = useState<string>("");
  const [posterBatchImages, setPosterBatchImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  useEffect(() => {
    setImageError("");
    setPosterBatchImages([]);
    setPosterImagePreview("");
    setSlugImagePreviews([]);
    setPosterFormData({
      poster_image_url: "",
    });
    setSlugFormData({
      more_description: "",
      image_url: "",
    });
    setEditingPosterId(null);
  }, [event.id]);

  const handleSlugImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setImageError("");
    setIsProcessingImage(true);

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

      if (editingSlugId) {
        // For editing: replace all images
        setSlugImagePreviews(compressedImages);
        setSlugFormData((prev) => ({
          ...prev,
          image_url: compressedImages.join("|"), // Store compressed images temporarily
        }));
      } else {
        // For adding: accumulate images
        setSlugImagePreviews((prev) => [...prev, ...compressedImages]);
        setSlugFormData((prev) => ({
          ...prev,
          image_url: [
            ...prev.image_url.split("|").filter(Boolean),
            ...compressedImages,
          ].join("|"),
        }));
      }
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Failed to process image",
      );
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handlePosterImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setImageError("");
    setIsProcessingImage(true);

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

      if (editingPosterId) {
        setPosterImagePreview(compressedImages[0]);
        setPosterFormData((prev) => ({
          ...prev,
          poster_image_url: compressedImages[0],
        }));
        setPosterBatchImages([]);
      } else {
        setPosterBatchImages(compressedImages);
        setPosterImagePreview(compressedImages[0]);
        setPosterFormData((prev) => ({
          ...prev,
          poster_image_url: compressedImages[0],
        }));
      }
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Failed to process image",
      );
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleAddSlug = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsUploadingImages(true);

      // Upload images to storage if they exist
      let imageUrls: string[] = [];
      if (slugImagePreviews.length > 0) {
        imageUrls = await uploadMultipleImages(slugImagePreviews, {
          bucket: "events",
          folder: `event-${event.id}/slugs`,
          fileName: `slug-${Date.now()}`,
        });
      }

      const slugData = {
        more_description: slugFormData.more_description,
        image_url: imageUrls.length > 0 ? imageUrls.join("|") : "", // Store multiple URLs separated by |
      };

      if (editingSlugId) {
        await onUpdateSlug(editingSlugId, slugData);
        setEditingSlugId(null);
      } else {
        await onAddSlug(slugData);
      }

      setSlugFormData({
        more_description: "",
        image_url: "",
      });
      setSlugImagePreviews([]);
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Failed to upload images",
      );
      console.error("Error saving slug:", error);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleAddPoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posterFormData.poster_image_url && posterBatchImages.length === 0)
      return;

    try {
      setIsUploadingImages(true);

      const imagesToAdd =
        posterBatchImages.length > 0
          ? posterBatchImages
          : [posterFormData.poster_image_url];

      for (let i = 0; i < imagesToAdd.length; i++) {
        const imageData = imagesToAdd[i];

        // Upload image to storage
        const [imageUrl] = await uploadMultipleImages([imageData], {
          bucket: "events",
          folder: `event-${event.id}/posters`,
          fileName: `poster-${Date.now()}-${i}`,
        });

        if (editingPosterId && i === 0) {
          await onUpdatePoster(editingPosterId, {
            poster_image_url: imageUrl,
          });
          setEditingPosterId(null);
        } else {
          await onAddPoster({
            poster_image_url: imageUrl,
          });
        }
      }

      setPosterFormData({
        poster_image_url: "",
      });
      setPosterImagePreview("");
      setPosterBatchImages([]);
      setImageError("");
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Failed to upload posters",
      );
      console.error("Error saving poster:", error);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleEditSlug = (slug: EventSlug) => {
    setEditingSlugId(slug.id);
    const imageUrls = slug.image_url
      ? slug.image_url.split("|").filter(Boolean)
      : [];
    setSlugFormData({
      more_description: slug.more_description || "",
      image_url: slug.image_url || "",
    });
    setSlugImagePreviews(imageUrls);
  };

  const handleEditPoster = (poster: Poster) => {
    setEditingPosterId(poster.id);
    setPosterFormData({
      poster_image_url: poster.poster_image_url,
    });
    setPosterImagePreview(poster.poster_image_url);
  };

  const handleCancelEdit = () => {
    setEditingSlugId(null);
    setEditingPosterId(null);
    setSlugFormData({
      more_description: "",
      image_url: "",
    });
    setPosterFormData({
      poster_image_url: "",
    });
    setSlugImagePreviews([]);
    setPosterImagePreview("");
    setPosterBatchImages([]);
    setImageError("");
  };

  const handleToggleRegistrationLocal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setRegistrationToggling(true);
      setImageError(""); // Clear any previous errors
      const newStatus = !event.registration_enabled;

      const response = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_enabled: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to toggle registration");
      }

      // Update the event object with new registration status
      event.registration_enabled = newStatus;

      // Call the parent handler to update state if provided
      if (onToggleRegistration) {
        onToggleRegistration(event, e);
      }

      // Clear success message after 2 seconds
      setTimeout(() => {
        setImageError("");
      }, 2000);
    } catch (error) {
      console.error("Error toggling registration:", error);
      setImageError(
        error instanceof Error
          ? error.message
          : "Failed to toggle registration. Check browser console for details.",
      );
    } finally {
      setRegistrationToggling(false);
    }
  };

  return (
    <div className="event-details-panel">
      <div className="details-header">
        <div className="header-top">
          <h3>Event Details</h3>
          <div className="header-actions">
            <button
              onClick={handleToggleRegistrationLocal}
              disabled={registrationToggling}
              className={`btn-registration-toggle ${event.registration_enabled ? "enabled" : "disabled"}`}
              title={
                event.registration_enabled
                  ? "Click to disable registrations"
                  : "Click to enable registrations"
              }
            >
              {registrationToggling
                ? "..."
                : event.registration_enabled
                  ? "OPEN"
                  : "CLOSED"}
            </button>
          </div>
        </div>
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "slugs" ? "active" : ""}`}
            onClick={() => setActiveTab("slugs")}
          >
            Event Information ({event.event_slug?.length || 0})
          </button>
          <button
            className={`tab-btn ${activeTab === "posters" ? "active" : ""}`}
            onClick={() => setActiveTab("posters")}
          >
            Posters ({event.posters?.length || 0})
          </button>
        </div>
      </div>

      {/* Slugs Section */}
      {activeTab === "slugs" && (
        <div className="details-section">
          {imageError && <div className="alert alert-error">{imageError}</div>}
          <form onSubmit={handleAddSlug} className="detail-form">
            <h4>
              {editingSlugId
                ? "Edit Event Information"
                : "Add Event Information"}
            </h4>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="slug-desc">Description</label>
                <textarea
                  id="slug-desc"
                  value={slugFormData.more_description}
                  onChange={(e) =>
                    setSlugFormData((prev) => ({
                      ...prev,
                      more_description: e.target.value,
                    }))
                  }
                  placeholder="Detailed description"
                  rows={3}
                  disabled={isLoading}
                  maxLength={2048}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="slug-image">Images (Multiple) *</label>
                <input
                  id="slug-image"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSlugImageChange}
                  disabled={isLoading || isProcessingImage || isUploadingImages}
                  className="file-input"
                />
                {imageError && <p className="input-error">{imageError}</p>}
                {!editingSlugId && slugImagePreviews.length > 1 && (
                  <p className="selection-note">
                    {slugImagePreviews.length} images selected
                  </p>
                )}
                {slugImagePreviews.length > 0 && (
                  <div className="image-preview-gallery">
                    {slugImagePreviews.map((preview, index) => (
                      <div key={index} className="preview-item">
                        <img src={preview} alt={`Slug image ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => {
                            setSlugImagePreviews((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                            setSlugFormData((prev) => {
                              const images = prev.image_url
                                .split("|")
                                .filter(Boolean);
                              images.splice(index, 1);
                              return {
                                ...prev,
                                image_url: images.join("|"),
                              };
                            });
                          }}
                          className="btn-remove-image-small"
                          disabled={isLoading || isUploadingImages}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={isLoading || isUploadingImages}
                className="btn-save"
              >
                {isLoading || isUploadingImages
                  ? "Saving..."
                  : editingSlugId
                    ? "Update"
                    : "Add"}
              </button>
              {editingSlugId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="items-list">
            <h4>Event Information Items</h4>
            {event.event_slug && event.event_slug.length > 0 ? (
              <div>
                {event.event_slug.map((slug) => (
                  <div key={slug.id} className="item-card">
                    <div className="item-actions">
                      <button
                        onClick={() => handleEditSlug(slug)}
                        className="btn-small btn-edit"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteSlug(slug.id)}
                        className="btn-small btn-delete"
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </div>
                    {slug.more_description && (
                      <p className="item-desc">{slug.more_description}</p>
                    )}
                    {slug.image_url && (
                      <div className="item-galleries">
                        {slug.image_url
                          .split("|")
                          .filter(Boolean)
                          .map((imageUrl, idx) => (
                            <div key={idx} className="gallery-thumbnail">
                              <img
                                src={imageUrl}
                                alt={`Event slug image ${idx + 1}`}
                                className="item-image"
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No event information added yet</p>
            )}
          </div>
        </div>
      )}

      {/* Posters Section */}
      {activeTab === "posters" && (
        <div className="details-section">
          <form onSubmit={handleAddPoster} className="detail-form">
            <h4>{editingPosterId ? "Edit Poster" : "Add Poster"}</h4>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="poster-image">Poster Image *</label>
                <input
                  id="poster-image"
                  type="file"
                  accept="image/*"
                  multiple={!editingPosterId}
                  onChange={handlePosterImageChange}
                  disabled={isLoading || isProcessingImage}
                  className="file-input"
                />
                {imageError && <p className="input-error">{imageError}</p>}
                {!editingPosterId && posterBatchImages.length > 1 && (
                  <p className="selection-note">
                    {posterBatchImages.length} images selected
                  </p>
                )}
                {posterImagePreview && (
                  <div className="image-preview-small">
                    <img src={posterImagePreview} alt="Poster preview" />
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={
                  isLoading ||
                  isProcessingImage ||
                  isUploadingImages ||
                  (!posterFormData.poster_image_url &&
                    posterBatchImages.length === 0)
                }
                className="btn-save"
              >
                {isLoading || isUploadingImages
                  ? "Saving..."
                  : editingPosterId
                    ? "Update"
                    : "Add"}
              </button>
              {editingPosterId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="items-list">
            <h4>Event Posters</h4>
            {event.posters && event.posters.length > 0 ? (
              <div className="posters-grid">
                {event.posters.map((poster) => (
                  <div key={poster.id} className="poster-card">
                    <img
                      src={poster.poster_image_url}
                      alt={`Poster ${poster.id}`}
                      className="poster-image"
                    />
                    <div className="poster-actions">
                      <button
                        onClick={() => handleEditPoster(poster)}
                        className="btn-small btn-edit"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeletePoster(poster.id)}
                        className="btn-small btn-delete"
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No posters added yet</p>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .event-details-panel {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .details-header {
          border-bottom: 1px solid #e5e7eb;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .details-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .tabs {
          display: flex;
          gap: 8px;
        }

        .tab-btn {
          padding: 8px 12px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b7280;
        }

        .tab-btn.active {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .details-section {
          padding: 16px;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 13px;
          font-weight: 500;
        }

        .alert-error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .alert-success {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }

        .detail-form {
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
        }

        .detail-form h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .form-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .form-row .form-group {
          flex: 1;
          margin-bottom: 0;
        }

        .form-group {
          margin-bottom: 12px;
        }

        label {
          display: block;
          margin-bottom: 4px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        input[type="text"],
        input[type="file"],
        textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 13px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        input[type="text"]:focus,
        textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        input[type="file"] {
          padding: 8px;
          cursor: pointer;
        }

        textarea {
          resize: vertical;
          min-height: 60px;
        }

        .image-preview-small {
          margin-top: 8px;
          max-width: 100px;
        }

        .image-preview-small img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          object-fit: cover;
        }

        .image-preview-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
          margin-top: 8px;
          padding: 8px;
          background-color: #f9fafb;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .preview-item {
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          background-color: white;
          border: 1px solid #d1d5db;
          aspect-ratio: 1;
        }

        .preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .btn-remove-image-small {
          position: absolute;
          top: 2px;
          right: 2px;
          padding: 2px 6px;
          background-color: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-remove-image-small:hover:not(:disabled) {
          background-color: #dc2626;
        }

        .btn-remove-image-small:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }

        .item-galleries {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
          margin-top: 8px;
        }

        .gallery-thumbnail {
          border-radius: 4px;
          overflow: hidden;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
        }

        .input-error {
          margin-top: 6px;
          font-size: 12px;
          color: #dc2626;
        }

        .selection-note {
          margin-top: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .btn-save,
        .btn-cancel {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-save {
          background-color: #10b981;
          color: white;
        }

        .btn-save:hover:not(:disabled) {
          background-color: #059669;
        }

        .btn-save:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }

        .btn-cancel {
          background-color: #e5e7eb;
          color: #374151;
        }

        .btn-cancel:hover:not(:disabled) {
          background-color: #d1d5db;
        }

        .items-list {
          margin-top: 20px;
        }

        .items-list h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .empty-state {
          text-align: center;
          padding: 20px;
          color: #9ca3af;
          font-size: 13px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .item-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .item-header h5 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .item-actions {
          display: flex;
          gap: 6px;
        }

        .btn-small {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-edit {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .btn-edit:hover:not(:disabled) {
          background-color: #bfdbfe;
        }

        .btn-delete {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .btn-delete:hover:not(:disabled) {
          background-color: #fecaca;
        }

        .btn-small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .item-desc {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #6b7280;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .item-image {
          max-width: 100%;
          max-height: 150px;
          border-radius: 4px;
          object-fit: cover;
        }

        .posters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .poster-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .poster-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .poster-actions {
          display: flex;
          gap: 4px;
          padding: 6px;
          background: rgba(0, 0, 0, 0.7);
          justify-content: center;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn-registration-toggle {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-registration-toggle.enabled {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }

        .btn-registration-toggle.enabled:hover {
          background-color: #bbf7d0;
        }

        .btn-registration-toggle.disabled {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .btn-registration-toggle.disabled:hover {
          background-color: #fecaca;
        }

        @media (max-width: 768px) {
          .posters-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }

          .form-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
