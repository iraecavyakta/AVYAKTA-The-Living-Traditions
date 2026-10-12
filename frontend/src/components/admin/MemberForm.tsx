"use client";

import { useState } from "react";
import {
  RECRUITMENT_BRANCHES,
  RECRUITMENT_DOMAINS,
} from "../../lib/validators/recruitment";

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

// Faculty sit outside the student teams, so these tags don't apply to them.
const FACULTY_HIDDEN_TAGS = ["current", "previous", "poc"];

const TEAM_TAGS = [
  { key: "current", label: "Current" },
  { key: "previous", label: "Previous" },
  { key: "founder", label: "Founder" },
  { key: "faculty", label: "Faculty" },
  { key: "poc", label: "POC" },
  { key: "club_head", label: "Club Head" },
];

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

  // Club Head is club-level (no domain/role); a POC's role defaults to Member.
  const isClubHead = formData.tags.includes("club_head");
  const isPoc = formData.tags.includes("poc");
  const isFaculty = formData.tags.includes("faculty");

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

  /**
   * Clears the photo. The API already maps an empty photo_url to null, so
   * saving after this detaches the image from the member. The stored file is
   * left in the bucket rather than deleted, since other records may point at
   * it and an orphaned object is cheaper than a broken reference.
   */
  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData((prev) => ({ ...prev, photo_url: "" }));
    setError("");
    const input = document.getElementById("photo") as HTMLInputElement | null;
    // Without this the same file cannot be re-picked: the input still holds
    // it, so choosing it again fires no change event.
    if (input) input.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name.trim() ||
      formData.tags.length === 0 ||
      (!isClubHead && !formData.domain.trim()) ||
      (!isClubHead && !isPoc && !formData.role.trim())
    ) {
      setError(
        "Name, at least one team tag, and a domain and role are required (a role is optional for POCs; Club Head needs no domain or role)",
      );
      return;
    }

    try {
      await onSubmit(
        isClubHead
          ? { ...formData, domain: "", role: "club_head" }
          : { ...formData, role: formData.role || "members" },
      );
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

          {!isClubHead && (
            <div className="form-group">
              <label htmlFor="domain">
                {isPoc ? "Department" : "Domain"}{" "}
                <span className="required">*</span>
              </label>
              <select
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleSelectChange}
                required
              >
                <option value="">
                  {isPoc ? "Select a department" : "Select a domain"}
                </option>
                {(isPoc ? RECRUITMENT_BRANCHES : RECRUITMENT_DOMAINS).map(
                  (option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ),
                )}
              </select>
            </div>
          )}

          {!isClubHead && (
            <div className="form-group">
              <label htmlFor="role">
                Role{" "}
                {isPoc ? (
                  <span className="optional">(defaults to Member)</span>
                ) : (
                  <span className="required">*</span>
                )}
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleSelectChange}
                required={!isPoc}
              >
                <option value="">
                  {isPoc ? "Member (default)" : "Select a role"}
                </option>
                <option value="domain_head">Domain Head</option>
                <option value="members">Members</option>
              </select>
            </div>
          )}

          <fieldset className="form-group">
            <legend>Team tags</legend>
            <div className="flex flex-wrap gap-3">
              {TEAM_TAGS.filter(
                ({ key }) => !(isFaculty && FACULTY_HIDDEN_TAGS.includes(key)),
              ).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.tags.includes(key)}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        tags: (event.target.checked
                          ? [...prev.tags, key]
                          : prev.tags.filter((item) => item !== key)
                        ).filter(
                          (item) =>
                            !(
                              key === "faculty" &&
                              event.target.checked &&
                              FACULTY_HIDDEN_TAGS.includes(item)
                            ),
                        ),
                        // Ticking POC swaps the dropdown from club domains to
                        // departments (and unticking swaps it back), so a
                        // value picked from the other list has to go: the
                        // select would show blank while still submitting it.
                        domain: key === "poc" ? "" : prev.domain,
                        // leaving Club Head: drop its placeholder role
                        role:
                          key === "club_head" &&
                          !event.target.checked &&
                          prev.role === "club_head"
                            ? ""
                            : prev.role,
                      }))
                    }
                  />
                  {label}
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
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isUploading}
              className="btn-remove-photo"
            >
              Remove photo
            </button>
            <small className="file-hint">
              The member falls back to their initials until a new photo is
              uploaded. Save the form to apply.
            </small>
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

        .btn-remove-photo {
          margin-top: 12px;
          padding: 8px 16px;
          border: 1px solid rgba(139, 26, 26, 0.5);
          border-radius: 999px;
          background: transparent;
          color: var(--av-crimson);
          font-family: var(--font-body), sans-serif;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-remove-photo:hover:not(:disabled) {
          background: var(--av-crimson);
          color: var(--av-warm);
        }

        .btn-remove-photo:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
