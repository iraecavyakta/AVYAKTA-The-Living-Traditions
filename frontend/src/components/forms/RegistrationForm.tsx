"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registrationSchema,
  REGISTRATION_BRANCHES,
  EVENT_DOMAINS,
  RegistrationFormData,
} from "../../lib/validators/registration";
import { compressImage, validateImage } from "../../lib/utils/imageOptimizer";
import { uploadImageToStorage } from "../../lib/utils/imageUploader";

type EventItem = {
  id: string;
  title: string;
  payment_image_required?: boolean;
};

export default function RegistrationForm({
  bgImage,
  events,
}: {
  bgImage?: string;
  events: EventItem[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [linkInputs, setLinkInputs] = useState([""]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [paymentImagePreview, setPaymentImagePreview] = useState("");
  const [paymentImageError, setPaymentImageError] = useState("");
  const [isProcessingPaymentImage, setIsProcessingPaymentImage] =
    useState(false);

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = setTimeout(() => setSuccessMessage(""), 5000);
    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      isVolunteer: false,
      hostel: false,
    },
  });

  const isVolunteer = useWatch({
    control,
    name: "isVolunteer",
  });

  const selectedEventId = useWatch({
    control,
    name: "eventSelector",
  });

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const paymentRequired = Boolean(selectedEvent?.payment_image_required);

  const handlePaymentImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPaymentImageError("");
    setIsProcessingPaymentImage(true);

    try {
      const validation = validateImage(file, 10);
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid image");
      }

      const compressed = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.7,
        maxSizeKB: 300,
      });
      setPaymentImagePreview(compressed);
    } catch (error) {
      setPaymentImageError(
        error instanceof Error ? error.message : "Failed to process image",
      );
    } finally {
      setIsProcessingPaymentImage(false);
    }
  };

  const addLinkInput = () => setLinkInputs([...linkInputs, ""]);
  const removeLinkInput = (index: number) => {
    setLinkInputs(linkInputs.filter((_, i) => i !== index));
  };
  const updateLinkInput = (index: number, value: string) => {
    const newLinks = [...linkInputs];
    newLinks[index] = value;
    setLinkInputs(newLinks);
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (paymentRequired && !paymentImagePreview) {
      setPaymentImageError("Please upload your payment screenshot");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");
    setPaymentImageError("");

    try {
      const validLinks = linkInputs.filter((link) => link.trim().length > 0);
      const linksJson =
        validLinks.length > 0 ? JSON.stringify(validLinks) : undefined;

      let paymentImageUrl: string | undefined;
      if (paymentImagePreview) {
        paymentImageUrl = await uploadImageToStorage(paymentImagePreview, {
          bucket: "payment",
          folder: `event-${data.eventSelector}`,
          fileName: `payment-${Date.now()}`,
        });
      }

      const payload = {
        ...data,
        links: linksJson,
        payment_image_url: paymentImageUrl,
      };

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || "Failed to submit registration");
        return;
      }

      setSuccessMessage("Registration submitted successfully!");
      setIsAnimating(true);

      setTimeout(() => {
        setShowThankYou(true);
        reset();
        setLinkInputs([""]);
        setPaymentImagePreview("");
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {successMessage && (
        <div className="message-box success-box">✓ {successMessage}</div>
      )}

      {errorMessage && (
        <div className="message-box error-box">✕ {errorMessage}</div>
      )}

      <div
        className={`recruitment-form-container ${isAnimating ? "form-animating" : ""}`}
        style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
      >
        {isAnimating ? (
          <div className="envelope-animation-container">
            <div className="envelope">
              <div className="envelope-flap"></div>
              <div className="envelope-body"></div>
            </div>
            {showThankYou && (
              <div className="thank-you-message">
                <h2 className="thank-you-title">Thank You</h2>
                <p className="thank-you-text">
                  Your registration has been submitted successfully!
                </p>
                <p className="thank-you-subtext">
                  We look forward to seeing you at the event. Keep an eye on
                  your email for further details.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAnimating(false)}
                  className="mt-6 rounded-full border border-[var(--bronze-gold)] px-6 py-2 text-sm font-semibold text-[var(--bronze-gold)]"
                >
                  Register Again
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="recruitment-form">
            {/* Event Selection & Role Toggle - Full Width */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <label htmlFor="eventSelector" className="form-label">
                    Select Event <span className="required">*</span>
                  </label>
                  <select
                    id="eventSelector"
                    aria-describedby={
                      errors.eventSelector ? "eventSelector-error" : undefined
                    }
                    {...register("eventSelector")}
                    className="form-select mt-2"
                  >
                    <option value="">-- Choose Event --</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                  {errors.eventSelector && (
                    <p id="eventSelector-error" className="form-error">
                      {errors.eventSelector.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-start gap-2 md:items-end">
                  <span className="form-label">I am registering as</span>
                  <div className="flex overflow-hidden rounded-full border-2 border-[#d9cbb8] bg-[rgba(252,248,240,0.94)] p-1 shadow-inner md:w-64">
                    <button
                      type="button"
                      aria-pressed={!isVolunteer}
                      className={`flex-1 rounded-full px-4 py-2 text-sm font-bold uppercase transition-all duration-300 ${
                        !isVolunteer
                          ? "bg-[var(--bronze-gold)] text-white shadow-md"
                          : "text-[var(--dull-olive)] hover:text-[var(--charcoal-black)]"
                      }`}
                      onClick={() => {
                        setValue("isVolunteer", false);
                        setValue("volunteerDomain", undefined);
                      }}
                    >
                      Participant
                    </button>
                    <button
                      type="button"
                      aria-pressed={isVolunteer}
                      className={`flex-1 rounded-full px-4 py-2 text-sm font-bold uppercase transition-all duration-300 ${
                        isVolunteer
                          ? "bg-[var(--emerald-green)] text-white shadow-md"
                          : "text-[var(--dull-olive)] hover:text-[var(--charcoal-black)]"
                      }`}
                      onClick={() => setValue("isVolunteer", true)}
                    >
                      Volunteer
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section-divider"></div>

            {/* LEFT COLUMN */}
            <div className="form-left">
              <div className="form-group">
                <label htmlFor="reg-name" className="form-label">
                  Name <span className="required">*</span>
                </label>
                <input
                  id="reg-name"
                  aria-describedby={errors.name ? "reg-name-error" : undefined}
                  {...register("name")}
                  type="text"
                  placeholder="Your full name"
                  className="form-input"
                />
                {errors.name && (
                  <p id="reg-name-error" className="form-error">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-email" className="form-label">
                  Email <span className="required">*</span>
                </label>
                <input
                  id="reg-email"
                  aria-describedby={
                    errors.email ? "reg-email-error" : undefined
                  }
                  {...register("email")}
                  type="email"
                  placeholder="your@email.com"
                  className="form-input"
                />
                {errors.email && (
                  <p id="reg-email-error" className="form-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-branch" className="form-label">
                  Branch <span className="required">*</span>
                </label>
                <select
                  id="reg-branch"
                  aria-describedby={
                    errors.branch ? "reg-branch-error" : undefined
                  }
                  {...register("branch")}
                  className="form-select"
                >
                  <option value="">Select your branch</option>
                  {REGISTRATION_BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {errors.branch && (
                  <p id="reg-branch-error" className="form-error">
                    {errors.branch.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-classYear" className="form-label">
                  Current Year <span className="required">*</span>
                </label>
                <input
                  id="reg-classYear"
                  aria-describedby={
                    errors.classYear ? "reg-classYear-error" : undefined
                  }
                  {...register("classYear", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter year"
                  className="form-input"
                />
                {errors.classYear && (
                  <p id="reg-classYear-error" className="form-error">
                    {errors.classYear.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-section" className="form-label">
                  Section <span className="required">*</span>
                </label>
                <input
                  id="reg-section"
                  aria-describedby={
                    errors.section ? "reg-section-error" : undefined
                  }
                  {...register("section")}
                  type="text"
                  placeholder="Your section"
                  className="form-input"
                />
                {errors.section && (
                  <p id="reg-section-error" className="form-error">
                    {errors.section.message}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="form-right">
              <div className="form-group">
                <label htmlFor="reg-srn" className="form-label">
                  SRN <span className="required">*</span>
                </label>
                <input
                  id="reg-srn"
                  aria-describedby={errors.srn ? "reg-srn-error" : undefined}
                  {...register("srn", {
                    onChange: (e) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
                  })}
                  type="text"
                  placeholder="PES2......"
                  maxLength={13}
                  className="form-input uppercase"
                />
                {errors.srn && (
                  <p id="reg-srn-error" className="form-error">
                    {errors.srn.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone_number" className="form-label">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  id="reg-phone_number"
                  aria-describedby={
                    errors.phone_number ? "reg-phone_number-error" : undefined
                  }
                  {...register("phone_number")}
                  type="tel"
                  placeholder="9876543210"
                  className="form-input"
                />
                {errors.phone_number && (
                  <p id="reg-phone_number-error" className="form-error">
                    {errors.phone_number.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  <input
                    {...register("hostel")}
                    type="checkbox"
                    className="h-4 w-4"
                  />
                  Staying in Hostel
                </label>
                {errors.hostel && (
                  <p className="form-error">{errors.hostel.message}</p>
                )}
              </div>
            </div>

            {/* DYNAMIC SECTION (Based on toggle) */}
            <div className="form-textarea-section">
              <h3 className="mb-4 font-serif text-xl font-bold text-[var(--bronze-gold)]">
                {isVolunteer ? "Volunteer Details" : "Participant Details"}
              </h3>

              {!isVolunteer ? (
                // Participant Fields
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="form-group">
                    <label htmlFor="reg-teamName" className="form-label">
                      Team Name{" "}
                      <span className="optional">(If team event)</span>
                    </label>
                    <input
                      id="reg-teamName"
                      {...register("teamName")}
                      type="text"
                      placeholder="Your team name"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-dietaryNeeds" className="form-label">
                      Dietary Needs <span className="optional">(Optional)</span>
                    </label>
                    <input
                      id="reg-dietaryNeeds"
                      {...register("dietaryNeeds")}
                      type="text"
                      placeholder="e.g. Vegetarian, Jain"
                      className="form-input"
                    />
                  </div>
                </div>
              ) : (
                // Volunteer Fields
                <div className="grid gap-6">
                  <div className="form-group">
                    <span className="form-label">
                      Domain of Help <span className="required">*</span>
                    </span>
                    <div className="domain-chips-container">
                      {EVENT_DOMAINS.map((domain) => (
                        <button
                          key={domain}
                          type="button"
                          aria-pressed={watch("volunteerDomain") === domain}
                          onClick={() => setValue("volunteerDomain", domain)}
                          className={`domain-chip ${
                            watch("volunteerDomain") === domain
                              ? "selected"
                              : ""
                          }`}
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                    {errors.volunteerDomain && (
                      <p className="form-error">
                        {errors.volunteerDomain.message}
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor="reg-volunteerExperience"
                      className="form-label"
                    >
                      Prior Volunteer Experience{" "}
                      <span className="optional">(Optional)</span>
                    </label>
                    <textarea
                      id="reg-volunteerExperience"
                      {...register("volunteerExperience")}
                      placeholder="Describe any past experience organising events..."
                      className="form-textarea"
                    />
                  </div>
                </div>
              )}

              {/* Links Section */}
              <div className="links-container mt-4">
                <div className="links-title">Supporting Links (Optional)</div>
                <div>
                  {linkInputs.map((link, index) => (
                    <div key={index} className="link-input-wrapper">
                      <input
                        type="url"
                        placeholder="Link to portfolio, drive, past works, etc"
                        value={link}
                        onChange={(e) => updateLinkInput(index, e.target.value)}
                        className="form-input"
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeLinkInput(index)}
                          className="remove-link-btn"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addLinkInput}
                  disabled={linkInputs.length >= 10}
                  className="add-link-btn"
                >
                  + Add Another Link
                </button>
              </div>
            </div>

            {/* Payment Section */}
            {paymentRequired && (
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">
                  Payment Copy Required <span className="required">*</span>
                </label>
                <p className="text-sm text-[var(--dull-olive)] mb-2">
                  This event requires proof of payment. Please upload a
                  screenshot of your payment.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentImageChange}
                  disabled={isProcessingPaymentImage}
                  className="form-input"
                />
                {paymentImageError && (
                  <p className="form-error">{paymentImageError}</p>
                )}
                {paymentImagePreview && (
                  <img
                    src={paymentImagePreview}
                    alt="Payment proof preview"
                    style={{
                      marginTop: "0.75rem",
                      maxWidth: "220px",
                      borderRadius: "10px",
                      border: "1.5px solid #d9cbb8",
                    }}
                  />
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`submit-button ${isSubmitting ? "button-loading" : ""}`}
              style={{
                background: isVolunteer
                  ? "linear-gradient(135deg, var(--emerald-green) 0%, #114227 100%)"
                  : undefined,
              }}
            >
              {isSubmitting
                ? ""
                : isVolunteer
                  ? "Register as Volunteer"
                  : "Register as Participant"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
