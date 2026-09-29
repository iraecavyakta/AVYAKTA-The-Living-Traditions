"use client";

import { useState } from "react";
import { RECRUITMENT_DOMAINS } from "../../lib/validators/recruitment";

interface FormData {
  name: string;
  domain: string;
  role: string;
  photo_url?: string;
  tags: string[];
  year: number | null;
}

interface MemberFormProps {
  member?: Partial<FormData> &
    Pick<FormData, "name" | "domain" | "role"> & { id: string };
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function MemberForm({
  member,
  onSubmit,
  onCancel,
  isLoading = false,
}: MemberFormProps) {
  const [formData, setFormData] = useState<FormData>(
    member
      ? {
          name: member.name,
          domain: member.domain,
          role: member.role,
          photo_url: member.photo_url,
          tags: member.tags || [],
          year: member.year ?? null,
        }
      : {
          name: "",
          domain: "",
          role: "",
          photo_url: "",
          tags: ["current"],
          year: null,
        },
  );
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    member?.photo_url || null,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      // Show preview while uploading
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);
      formDataToSend.append("memberId", member?.id || "new");

      const response = await fetch("/api/members/upload", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const result = await response.json();
      setFormData((prev) => ({ ...prev, photo_url: result.photo_url }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      setPhotoPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name.trim() ||
      !formData.domain.trim() ||
      !formData.role.trim() ||
      formData.tags.length === 0
    ) {
      setError("Name, domain, role, and at least one team tag are required");
      return;
    }

    try {
      await onSubmit(formData);
      if (!member) {
        setFormData({
          name: "",
          domain: "",
          role: "",
          photo_url: "",
          tags: ["current"],
          year: null,
        });
        setPhotoPreview(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="member-form">
      <h3>{member ? "Edit Member" : "Add New Member"}</h3>
      <div className="title-rule" aria-hidden />

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter member name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="domain">
              Domain <span className="required">*</span>
            </label>
            <select
              id="domain"
              name="domain"
              value={formData.domain}
              onChange={handleSelectChange}
              required
            >
              <option value="">Select a domain</option>
              {RECRUITMENT_DOMAINS.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="role">
              Role <span className="required">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleSelectChange}
              required
            >
              <option value="">Select a role</option>
              <option value="domain_head">Domain Head</option>
              <option value="members">Members</option>
            </select>
          </div>

          <fieldset className="form-group">
            <legend>Team tags</legend>
            <div className="flex flex-wrap gap-3">
              {["current", "previous", "founder", "faculty"].map((tag) => (
                <label key={tag} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.tags.includes(tag)}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        tags: event.target.checked
                          ? [...prev.tags, tag]
                          : prev.tags.filter((item) => item !== tag),
                      }))
                    }
                  />
                  {tag[0].toUpperCase() + tag.slice(1)}
                </label>
              ))}
            </div>
          </fieldset>
          {formData.tags.includes("previous") && (
            <div className="form-group">
              <label htmlFor="year">Team year</label>
              <input
                id="year"
                type="number"
                min="2000"
                max="2100"
                value={formData.year ?? ""}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    year: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
                placeholder="e.g. 2026"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="photo">
              Photo <span className="optional">(optional)</span>
            </label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={isUploading}
              className="file-input"
            />
            <small className="file-hint">
              Accepted: JPG, PNG, GIF, WebP (max 5MB)
            </small>
          </div>
        </div>

        {photoPreview && (
          <div className="photo-preview">
            <small>Preview</small>
            <img src={photoPreview} alt="Member preview" />
          </div>
        )}

        {isUploading && <div className="uploading">Uploading image…</div>}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading || isUploading}
            className="btn-primary"
          >
            {isLoading ? "Saving…" : member ? "Update Member" : "Add Member"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading || isUploading}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>

      <style jsx>{`
        .member-form {
          background: var(--av-warm);
          border: 1px solid rgba(146, 121, 27, 0.3);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 16px 40px rgba(28, 28, 28, 0.35);
        }

        .member-form h3 {
          margin: 0;
          font-family: var(--font-heading), serif;
          font-size: 28px;
          font-weight: 600;
          color: var(--av-bronze);
        }

        .title-rule {
          height: 1px;
          margin: 16px 0 24px;
          background: linear-gradient(
            90deg,
            rgba(201, 168, 76, 0.55),
            transparent
          );
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 8px;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--av-olive);
        }

        .required {
          color: var(--av-crimson);
        }

        .optional {
          text-transform: none;
          letter-spacing: 0;
          font-weight: 400;
          font-style: italic;
        }

        .form-group input[type="text"],
        .form-group select {
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
        .form-group select:focus {
          outline: none;
          border-color: var(--av-gold);
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.25);
        }

        .form-group select {
          cursor: pointer;
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

        .file-hint {
          margin-top: 8px;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          color: var(--av-olive);
        }

        .photo-preview {
          margin-top: 24px;
          padding: 16px;
          border: 1px dashed rgba(146, 121, 27, 0.4);
          border-radius: 12px;
          background: rgba(146, 121, 27, 0.05);
        }

        .photo-preview small {
          display: block;
          margin-bottom: 8px;
          font-family: var(--font-body), sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--av-olive);
        }

        .photo-preview img {
          max-width: 100%;
          max-height: 160px;
          border-radius: 8px;
          border: 1px solid rgba(201, 168, 76, 0.5);
          object-fit: cover;
        }

        .uploading {
          margin-top: 16px;
          padding: 12px 16px;
          border-radius: 10px;
          border-left: 3px solid var(--av-gold);
          background: rgba(201, 168, 76, 0.12);
          font-family: var(--font-body), sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: var(--av-bronze);
        }

        .form-error {
          margin-top: 16px;
          padding: 12px 16px;
          border-radius: 10px;
          border-left: 3px solid var(--av-crimson);
          background: rgba(139, 26, 26, 0.08);
          font-family: var(--font-body), sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: var(--av-crimson);
        }

        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 32px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 12px 32px;
          border-radius: 999px;
          font-family: var(--font-body), sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            background-color 0.2s ease,
            color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .btn-primary {
          border: 1px solid var(--av-bronze);
          background: var(--av-bronze);
          color: var(--av-warm);
          box-shadow: 0 8px 24px rgba(146, 121, 27, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: scale(1.03);
          background: var(--av-gold);
          border-color: var(--av-gold);
          color: var(--av-charcoal);
          box-shadow: 0 10px 30px rgba(201, 168, 76, 0.45);
        }

        .btn-secondary {
          border: 1px solid rgba(115, 121, 85, 0.5);
          background: transparent;
          color: var(--av-olive);
        }

        .btn-secondary:hover:not(:disabled) {
          transform: scale(1.03);
          border-color: var(--av-charcoal);
          color: var(--av-charcoal);
        }

        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .btn-primary,
          .btn-secondary,
          .file-input,
          .form-group input[type="text"],
          .form-group select {
            transition: none;
          }

          .btn-primary:hover:not(:disabled),
          .btn-secondary:hover:not(:disabled) {
            transform: none;
          }
        }

        @media (max-width: 768px) {
          .member-form {
            padding: 24px 20px;
          }

          .member-form h3 {
            font-size: 24px;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
