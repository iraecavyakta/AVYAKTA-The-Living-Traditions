"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  recruitmentSchema,
  RECRUITMENT_BRANCHES,
  RECRUITMENT_DOMAINS,
  RecruitmentFormData,
} from "../../lib/validators/recruitment";

export default function RecruitmentForm({ bgImage }: { bgImage?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [linkInputs, setLinkInputs] = useState([""]); // Local state for dynamic links
  const [isAnimating, setIsAnimating] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Cleanup timeout on unmount to prevent memory leaks
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
    watch,
    setValue,
    clearErrors,
  } = useForm<RecruitmentFormData>({
    resolver: zodResolver(recruitmentSchema),
  });

  const selectedFirstPreference = useWatch({
    control,
    name: "first_preference_domain",
  });

  const selectedSecondDomain = useWatch({
    control,
    name: "second_domain_preference",
  });

  const addLinkInput = () => setLinkInputs([...linkInputs, ""]);
  const removeLinkInput = (index: number) => {
    setLinkInputs(linkInputs.filter((_, i) => i !== index));
  };
  const updateLinkInput = (index: number, value: string) => {
    const newLinks = [...linkInputs];
    newLinks[index] = value;
    setLinkInputs(newLinks);
  };

  const onSubmit = async (data: RecruitmentFormData) => {
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Filter empty links and convert to JSON string
      const validLinks = linkInputs.filter((link) => link.trim().length > 0);
      const linksJson =
        validLinks.length > 0 ? JSON.stringify(validLinks) : undefined;

      const payload = {
        ...data,
        links: linksJson,
      };

      const response = await fetch("/api/recruitment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || "Failed to submit application");
        return;
      }

      setSuccessMessage("Application submitted successfully!");
      setIsAnimating(true);

      // Wait for envelope animation to complete
      setTimeout(() => {
        setShowThankYou(true);
        reset();
        setLinkInputs([""]);
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
      {/* Ethics Statement */}
      <div className="ethics-statement">
        <div className="ethics-title">Our Commitment to You</div>
        <div className="ethics-content">
          By joining Avyakta, you&apos;re becoming part of a diverse community
          dedicated to celebrating cultural traditions while fostering
          innovation, creativity, and personal growth. We believe in fostering
          an inclusive space where your unique perspectives are valued.
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="message-box success-box">✓ {successMessage}</div>
      )}

      {errorMessage && (
        <div className="message-box error-box">✕ {errorMessage}</div>
      )}

      {/* Form Container */}
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
                <h2 className="thank-you-title">🙏 Thank You!</h2>
                <p className="thank-you-text">
                  Your application has been submitted successfully!
                </p>
                <p className="thank-you-subtext">
                  We appreciate your interest in joining Avyakta. Our team will
                  review your application and get back to you soon.
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="recruitment-form">
            {/* LEFT COLUMN */}
            <div className="form-left">
              {/* Name Field */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Name <span className="required">*</span>
                </label>
                <input
                  id="name"
                  aria-describedby={errors.name ? "name-error" : undefined}
                  {...register("name")}
                  type="text"
                  placeholder="Your full name"
                  maxLength={1024}
                  className="form-input"
                />
                {errors.name && (
                  <p id="name-error" className="form-error">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email <span className="required">*</span>
                </label>
                <input
                  id="email"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                  type="email"
                  placeholder="your@email.com"
                  className="form-input"
                />
                {errors.email && (
                  <p id="email-error" className="form-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Branch Field */}
              <div className="form-group">
                <label htmlFor="branch" className="form-label">
                  Branch <span className="required">*</span>
                </label>
                <select
                  id="branch"
                  aria-describedby={errors.branch ? "branch-error" : undefined}
                  {...register("branch")}
                  className="form-select"
                >
                  <option value="">Select your branch</option>
                  {RECRUITMENT_BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {errors.branch && (
                  <p id="branch-error" className="form-error">
                    {errors.branch.message}
                  </p>
                )}
              </div>

              {/* Year Field */}
              <div className="form-group">
                <label htmlFor="year" className="form-label">
                  Year <span className="required">*</span>
                </label>
                <input
                  id="year"
                  aria-describedby={errors.year ? "year-error" : undefined}
                  {...register("year", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter year"
                  className="form-input"
                />
                {errors.year && (
                  <p id="year-error" className="form-error">
                    {errors.year.message}
                  </p>
                )}
              </div>

              {/* Section Field */}
              <div className="form-group">
                <label htmlFor="section" className="form-label">
                  Section <span className="required">*</span>
                </label>
                <input
                  id="section"
                  aria-describedby={
                    errors.section ? "section-error" : undefined
                  }
                  {...register("section")}
                  type="text"
                  placeholder="Your section"
                  maxLength={1024}
                  className="form-input"
                />
                {errors.section && (
                  <p id="section-error" className="form-error">
                    {errors.section.message}
                  </p>
                )}
              </div>

              {/* First Domain Preference */}
              <div className="form-group">
                <label className="form-label">
                  First Domain Preference <span className="required">*</span>
                </label>
                <div className="domain-chips-container">
                  {RECRUITMENT_DOMAINS.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => {
                        const currentValue = watch("first_preference_domain");
                        if (currentValue === domain) {
                          // Deselect - reset form with undefined for this field
                          const formData = watch();
                          reset({
                            ...formData,
                            first_preference_domain: undefined,
                          } as Partial<RecruitmentFormData>);
                        } else {
                          setValue("first_preference_domain", domain);
                          clearErrors("first_preference_domain");
                        }
                      }}
                      className={`domain-chip ${
                        watch("first_preference_domain") === domain
                          ? "selected"
                          : ""
                      } ${domain === selectedSecondDomain ? "disabled" : ""}`}
                      aria-pressed={watch("first_preference_domain") === domain}
                      disabled={domain === selectedSecondDomain}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
                {errors.first_preference_domain && (
                  <p className="form-error">
                    {errors.first_preference_domain.message}
                  </p>
                )}
              </div>

              {/* Second Domain Preference */}
              <div className="form-group">
                <label className="form-label">
                  Second Domain <span className="optional">(Optional)</span>
                </label>
                <div className="domain-chips-container">
                  {RECRUITMENT_DOMAINS.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => {
                        const currentValue = watch("second_domain_preference");
                        if (currentValue === domain) {
                          // Deselect - reset form with undefined for this field
                          const formData = watch();
                          reset({
                            ...formData,
                            second_domain_preference: undefined,
                          } as Partial<RecruitmentFormData>);
                        } else {
                          setValue("second_domain_preference", domain);
                          clearErrors("second_domain_preference");
                        }
                      }}
                      className={`domain-chip ${
                        watch("second_domain_preference") === domain
                          ? "selected"
                          : ""
                      } ${domain === selectedFirstPreference ? "disabled" : ""}`}
                      aria-pressed={
                        watch("second_domain_preference") === domain
                      }
                      disabled={domain === selectedFirstPreference}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
                {errors.second_domain_preference && (
                  <p className="form-error">
                    {errors.second_domain_preference.message}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="form-right">
              {/* SRN Field */}
              <div className="form-group">
                <label htmlFor="srn" className="form-label">
                  SRN <span className="required">*</span>
                </label>
                <input
                  id="srn"
                  aria-describedby={errors.srn ? "srn-error" : undefined}
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
                  <p id="srn-error" className="form-error">
                    {errors.srn.message}
                  </p>
                )}
              </div>

              {/* Phone Number Field */}
              <div className="form-group">
                <label htmlFor="phone_number" className="form-label">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  id="phone_number"
                  aria-describedby={
                    errors.phone_number ? "phone_number-error" : undefined
                  }
                  {...register("phone_number")}
                  type="tel"
                  placeholder="9876543210"
                  className="form-input"
                />
                {errors.phone_number && (
                  <p id="phone_number-error" className="form-error">
                    {errors.phone_number.message}
                  </p>
                )}
              </div>
            </div>

            {/* FULL WIDTH TEXTAREA SECTION */}
            <div className="form-textarea-section">
              {/* Experience Field */}
              <div className="form-group">
                <label htmlFor="experience" className="form-label">
                  Experience
                </label>
                <textarea
                  id="experience"
                  aria-describedby={
                    errors.experience ? "experience-error" : undefined
                  }
                  {...register("experience")}
                  placeholder="Your relevant experience and achievements"
                  maxLength={1024}
                  className="form-textarea"
                />
                {errors.experience && (
                  <p id="experience-error" className="form-error">
                    {errors.experience.message}
                  </p>
                )}
              </div>

              {/* Links Section */}
              <div className="links-container">
                <div className="links-title">
                  📚 Showcase Your Work (Optional)
                </div>
                <div>
                  {linkInputs.map((link, index) => (
                    <div key={index} className="link-input-wrapper">
                      <input
                        type="url"
                        placeholder="Paste your portfolio, GitHub, Google Drive, or project link"
                        value={link}
                        onChange={(e) => updateLinkInput(index, e.target.value)}
                        maxLength={1024}
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
                {linkInputs.length >= 10 && (
                  <p className="form-error" style={{ marginTop: "0.8rem" }}>
                    Maximum 10 links allowed
                  </p>
                )}
              </div>

              {/* Why You Field */}
              <div className="form-group">
                <label htmlFor="why_you" className="form-label">
                  What Do You Bring To Table?{" "}
                  <span className="required">*</span>
                </label>
                <textarea
                  id="why_you"
                  aria-describedby={
                    errors.why_you ? "why_you-error" : undefined
                  }
                  {...register("why_you")}
                  placeholder="Why are you interested in Avyakta?"
                  maxLength={1024}
                  className="form-textarea"
                />
                {errors.why_you && (
                  <p id="why_you-error" className="form-error">
                    {errors.why_you.message}
                  </p>
                )}
              </div>

              {/* Why Us Field */}
              <div className="form-group">
                <label htmlFor="why_us" className="form-label">
                  Why Avyakta? <span className="required">*</span>
                </label>
                <textarea
                  id="why_us"
                  aria-describedby={errors.why_us ? "why_us-error" : undefined}
                  {...register("why_us")}
                  placeholder="What do you expect from Avyakta?"
                  maxLength={1024}
                  className="form-textarea"
                />
                {errors.why_us && (
                  <p id="why_us-error" className="form-error">
                    {errors.why_us.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`submit-button ${isSubmitting ? "button-loading" : ""}`}
            >
              {isSubmitting ? "" : "Submit Application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
