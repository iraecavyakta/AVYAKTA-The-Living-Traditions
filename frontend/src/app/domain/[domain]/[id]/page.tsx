"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDomainFromUrl } from "@/lib/utils/domainFormatter";
import { isValidDomain } from "@/lib/utils/domainValidator";
import DomainTopBar from "@/components/domain/DomainTopBar";
import DashboardPageBackground from "@/components/layout/DashboardPageBackground";
import recruitBackground from "../../../../../Domain_Dash_Img/image-2.png";

type RecruitRow = {
  id: string;
  name: string;
  srn: string;
  email: string;
  phone_no: string;
  year: number;
  branch: string;
  section: string;
  first_preference_domain: string;
  second_domain_preference: string | null;
  experience: string | null;
  why_you: string;
  why_us: string;
  links: string | null;
  interview: boolean | null;
  first_preference_status: string | null;
};

type SecondPreferenceRow = {
  id: string;
  recruitment_id: string;
  interview: boolean | null;
  second_preference_status: string | null;
};

const normalizeStatus = (status: string | null | undefined) =>
  status === "not_sure" || !status ? "pending" : status;

const parseLinks = (links: string | null): string[] => {
  if (!links) {
    return [];
  }

  try {
    const parsed = JSON.parse(links);
    return Array.isArray(parsed)
      ? parsed.filter((link) => typeof link === "string")
      : [];
  } catch {
    return [];
  }
};

/** Shared shell so the loading / error / not-found states stay on-brand. */
function RecruitStateShell({
  domainName,
  backHref,
  children,
  tone = "muted",
}: {
  domainName: string;
  backHref?: string;
  children: React.ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <>
      <DashboardPageBackground src={recruitBackground.src} />
      <DomainTopBar domainName={domainName} backHref={backHref} />

      <main className="recruit-container">
        <div className="recruit-wrapper">
          <div className={`state-panel ${tone}`}>{children}</div>
        </div>
      </main>

      <style jsx>{`
        .recruit-container {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          padding: 48px 24px 64px;
        }

        .recruit-wrapper {
          max-width: 1100px;
          margin: 0 auto;
        }

        .state-panel {
          background: var(--av-warm);
          border: 1px solid rgba(146, 121, 27, 0.3);
          border-radius: 16px;
          padding: 40px 24px;
          text-align: center;
          font-family: var(--font-accent), serif;
          font-style: italic;
          font-size: 15px;
          color: var(--av-olive);
          box-shadow: 0 16px 40px rgba(28, 28, 28, 0.35);
        }

        .state-panel.error {
          padding: 20px 24px;
          text-align: left;
          font-family: var(--font-body), sans-serif;
          font-style: normal;
          font-weight: 500;
          color: var(--av-crimson);
          border-color: rgba(139, 26, 26, 0.45);
          border-left: 4px solid var(--av-crimson);
        }

        @media (max-width: 768px) {
          .recruit-container {
            padding: 32px 16px 48px;
          }
        }
      `}</style>
    </>
  );
}

export default function RecruitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const domain = typeof params.domain === "string" ? params.domain : "";
  const recruitId = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recruit, setRecruit] = useState<RecruitRow | null>(null);
  const [secondPreference, setSecondPreference] =
    useState<SecondPreferenceRow | null>(null);
  const [firstStatus, setFirstStatus] = useState("pending");
  const [firstPersistedStatus, setFirstPersistedStatus] = useState("pending");
  const [firstInterview, setFirstInterview] = useState(false);
  const [secondStatus, setSecondStatus] = useState("pending");
  const [secondPersistedStatus, setSecondPersistedStatus] = useState("pending");
  const [secondInterview, setSecondInterview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRecruit = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isValidDomain(domain) || !recruitId) {
          throw new Error("Invalid recruit route");
        }

        const response = await fetch(`/api/domain/${domain}/${recruitId}`);
        if (!response.ok) {
          throw new Error("Failed to load recruit details");
        }

        const payload = await response.json();
        setRecruit(payload.recruit ?? null);
        setSecondPreference(payload.secondPreference ?? null);

        const recruitStatus = normalizeStatus(
          payload.recruit?.first_preference_status,
        );
        setFirstStatus(recruitStatus);
        setFirstPersistedStatus(recruitStatus);
        setFirstInterview(Boolean(payload.recruit?.interview));

        const secondPreferenceStatus = normalizeStatus(
          payload.secondPreference?.second_preference_status,
        );
        setSecondStatus(secondPreferenceStatus);
        setSecondPersistedStatus(secondPreferenceStatus);
        setSecondInterview(Boolean(payload.secondPreference?.interview));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load recruit details",
        );
      } finally {
        setLoading(false);
      }
    };

    loadRecruit();
  }, [domain, recruitId]);

  const selectStatus = (
    nextStatus: "approved" | "rejected",
    isSecondPreferenceTarget: boolean,
  ) => {
    if (
      !isSecondPreferenceTarget &&
      (firstPersistedStatus === "approved" ||
        firstPersistedStatus === "rejected")
    ) {
      return;
    }

    if (
      isSecondPreferenceTarget &&
      (secondPersistedStatus === "approved" ||
        secondPersistedStatus === "rejected")
    ) {
      return;
    }

    if (isSecondPreferenceTarget) {
      setSecondStatus((prev) => (prev === nextStatus ? "pending" : nextStatus));
    } else {
      setFirstStatus((prev) => (prev === nextStatus ? "pending" : nextStatus));
    }
  };

  const handleSave = async () => {
    if (!recruitId || !isValidDomain(domain)) {
      return;
    }

    const canEditFirstPreference =
      firstPersistedStatus !== "approved" &&
      firstPersistedStatus !== "rejected";
    const canEditSecondPreference =
      firstStatus === "rejected" &&
      secondPersistedStatus !== "approved" &&
      secondPersistedStatus !== "rejected";

    try {
      setSaving(true);

      const responses: Response[] = [];

      if (canEditFirstPreference) {
        const response = await fetch(`/api/domain/${domain}/${recruitId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interview: firstInterview,
            status: firstStatus,
            isSecondPreference: false,
          }),
        });

        responses.push(response);
      }

      if (
        canEditSecondPreference &&
        (secondPreference ||
          recruit?.second_domain_preference === formatDomainFromUrl(domain))
      ) {
        const response = await fetch(`/api/domain/${domain}/${recruitId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interview: secondInterview,
            status: secondStatus,
            isSecondPreference: true,
          }),
        });

        responses.push(response);
      }

      if (responses.some((response) => !response.ok)) {
        throw new Error("Failed to update recruit");
      }

      router.push(`/domain/${domain}`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update recruit",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isValidDomain(domain)) {
    return (
      <RecruitStateShell domainName="Domain" tone="error">
        Invalid domain.
      </RecruitStateShell>
    );
  }

  const domainName = formatDomainFromUrl(domain);
  const backHref = `/domain/${domain}`;

  if (loading) {
    return (
      <RecruitStateShell domainName={domainName} backHref={backHref}>
        Loading recruit details...
      </RecruitStateShell>
    );
  }

  if (error) {
    return (
      <RecruitStateShell
        domainName={domainName}
        backHref={backHref}
        tone="error"
      >
        {error}
      </RecruitStateShell>
    );
  }

  if (!recruit) {
    return (
      <RecruitStateShell domainName={domainName} backHref={backHref}>
        Recruit not found.
      </RecruitStateShell>
    );
  }

  const firstLocked =
    firstPersistedStatus === "approved" || firstPersistedStatus === "rejected";
  const secondLocked =
    secondPersistedStatus === "approved" ||
    secondPersistedStatus === "rejected";
  const showSecondPreference =
    firstStatus === "rejected" &&
    (secondPreference || recruit.second_domain_preference === domainName);
  const links = parseLinks(recruit.links);

  return (
    <>
      <DashboardPageBackground src={recruitBackground.src} />
      <DomainTopBar domainName={domainName} backHref={backHref} />

      <main className="recruit-container">
        <div className="recruit-wrapper">
          <header className="recruit-header">
            <span className="corner corner-tl" aria-hidden />
            <span className="corner corner-br" aria-hidden />

            <p className="recruit-label">{domainName} Applicant</p>
            <h1>{recruit.name}</h1>
            <p className="recruit-tagline">
              Review the application, then record your decision.
            </p>

            <div className="rangoli" aria-hidden>
              <span className="dot small" />
              <span className="dot large" />
              <span className="dot small" />
            </div>
          </header>

          <div className="recruit-grid">
            {/* ---------- Profile ---------- */}
            <section className="panel">
              <h2>Profile</h2>
              <dl className="profile-list">
                <dt>SRN</dt>
                <dd className="numeric">{recruit.srn}</dd>

                <dt>Email</dt>
                <dd>{recruit.email}</dd>

                <dt>Phone</dt>
                <dd className="numeric">{recruit.phone_no}</dd>

                <dt>Branch</dt>
                <dd>{recruit.branch}</dd>

                <dt>Section</dt>
                <dd>{recruit.section}</dd>

                <dt>Year</dt>
                <dd className="numeric">{recruit.year}</dd>
              </dl>
            </section>

            {/* ---------- Decision ---------- */}
            <section className="panel decision-panel">
              <h2>First Preference</h2>

              <div className={`decision-block ${firstLocked ? "locked" : ""}`}>
                {firstLocked ? (
                  <p className="locked-note">
                    Decision recorded as
                    <span className={`status-pill ${firstPersistedStatus}`}>
                      {firstPersistedStatus}
                    </span>
                  </p>
                ) : (
                  <>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={firstInterview}
                        onChange={(event) =>
                          setFirstInterview(event.target.checked)
                        }
                      />
                      <span>Interview completed</span>
                    </label>

                    <div className="decision-actions">
                      <button
                        type="button"
                        onClick={() => selectStatus("approved", false)}
                        disabled={saving}
                        className={`btn-decide accept ${firstStatus === "approved" ? "chosen" : ""}`}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => selectStatus("rejected", false)}
                        disabled={saving}
                        className={`btn-decide reject ${firstStatus === "rejected" ? "chosen" : ""}`}
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}
              </div>

              {showSecondPreference && (
                <>
                  <div className="panel-rule" aria-hidden />
                  <h3>Second Preference</h3>

                  <div
                    className={`decision-block ${secondLocked ? "locked" : ""}`}
                  >
                    {secondLocked ? (
                      <p className="locked-note">
                        Decision recorded as
                        <span
                          className={`status-pill ${secondPersistedStatus}`}
                        >
                          {secondPersistedStatus}
                        </span>
                      </p>
                    ) : (
                      <>
                        <label className="check-row">
                          <input
                            type="checkbox"
                            checked={secondInterview}
                            onChange={(event) =>
                              setSecondInterview(event.target.checked)
                            }
                          />
                          <span>Interview completed</span>
                        </label>

                        <div className="decision-actions">
                          <button
                            type="button"
                            onClick={() => selectStatus("approved", true)}
                            disabled={saving}
                            className={`btn-decide accept ${secondStatus === "approved" ? "chosen" : ""}`}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => selectStatus("rejected", true)}
                            disabled={saving}
                            className={`btn-decide reject ${secondStatus === "rejected" ? "chosen" : ""}`}
                          >
                            Reject
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              <div className="panel-rule" aria-hidden />

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-save"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </section>
          </div>

          {/* ---------- Application ---------- */}
          <section className="panel application-panel">
            <h2>Application</h2>

            <article className="answer">
              <h3>Why do you want to join?</h3>
              <p>{recruit.why_you}</p>
            </article>

            <article className="answer">
              <h3>Why Avyakta?</h3>
              <p>{recruit.why_us}</p>
            </article>

            <article className="answer">
              <h3>Experience</h3>
              <p>{recruit.experience || "Not provided"}</p>
            </article>

            <article className="answer">
              <h3>Links</h3>
              {links.length > 0 ? (
                <ul className="link-list">
                  {links.map((link, index) => (
                    <li key={`${link}-${index}`}>
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No links provided</p>
              )}
            </article>
          </section>
        </div>
      </main>

      <style jsx>{`
        .recruit-container {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          padding: 48px 24px 64px;
        }

        .recruit-wrapper {
          max-width: 1100px;
          margin: 0 auto;
        }

        /* ---------- Header ---------- */
        .recruit-header {
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

        .recruit-label {
          margin: 0;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--av-olive);
          letter-spacing: 5px;
          text-transform: uppercase;
        }

        .recruit-header h1 {
          margin: 12px 0 8px;
          font-family: var(--font-heading), serif;
          font-size: 44px;
          font-weight: 600;
          color: var(--av-bronze);
          letter-spacing: 0.5px;
          line-height: 1.15;
        }

        .recruit-tagline {
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

        /* ---------- Panels ---------- */
        .recruit-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
          align-items: start;
        }

        .panel {
          position: relative;
          background: var(--av-warm);
          border: 1px solid rgba(146, 121, 27, 0.3);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 16px 40px rgba(28, 28, 28, 0.35);
          overflow: hidden;
        }

        /* Gold accent along the top edge */
        .panel::before {
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
        }

        .panel h2 {
          margin: 0 0 24px;
          padding-bottom: 16px;
          font-family: var(--font-heading), serif;
          font-size: 28px;
          font-weight: 600;
          color: var(--av-bronze);
          border-bottom: 1px solid rgba(201, 168, 76, 0.35);
        }

        .panel h3 {
          margin: 0 0 16px;
          font-family: var(--font-heading), serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--av-bronze);
        }

        .panel-rule {
          height: 1px;
          margin: 24px 0;
          background: linear-gradient(
            90deg,
            rgba(201, 168, 76, 0.5),
            transparent
          );
        }

        /* ---------- Profile list ---------- */
        .profile-list {
          display: grid;
          grid-template-columns: 110px 1fr;
          margin: 0;
        }

        .profile-list dt {
          padding: 12px 0;
          font-family: var(--font-body), sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--av-olive);
          border-bottom: 1px solid rgba(201, 168, 76, 0.22);
        }

        .profile-list dd {
          padding: 12px 0;
          margin: 0;
          font-family: var(--font-body), sans-serif;
          font-size: 14px;
          color: var(--av-charcoal);
          word-break: break-word;
          border-bottom: 1px solid rgba(201, 168, 76, 0.22);
        }

        .profile-list dd.numeric {
          font-variant-numeric: lining-nums tabular-nums;
          letter-spacing: 0.5px;
        }

        .profile-list dt:last-of-type,
        .profile-list dd:last-of-type {
          border-bottom: none;
        }

        /* ---------- Decision ---------- */
        .decision-block {
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(146, 121, 27, 0.25);
          background: rgba(146, 121, 27, 0.05);
        }

        .decision-block.locked {
          border-style: dashed;
        }

        .locked-note {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin: 0;
          font-family: var(--font-body), sans-serif;
          font-size: 12px;
          font-style: italic;
          color: var(--av-olive);
        }

        .status-pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 999px;
          font-family: var(--font-body), sans-serif;
          font-size: 10px;
          font-weight: 600;
          font-style: normal;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .status-pill.approved {
          background: rgba(27, 94, 59, 0.12);
          border: 1px solid rgba(27, 94, 59, 0.45);
          color: var(--av-emerald);
        }

        .status-pill.rejected {
          background: rgba(139, 26, 26, 0.1);
          border: 1px solid rgba(139, 26, 26, 0.45);
          color: var(--av-crimson);
        }

        .check-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-body), sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--av-charcoal);
          cursor: pointer;
        }

        .check-row input {
          width: 18px;
          height: 18px;
          accent-color: var(--av-bronze);
          cursor: pointer;
          flex-shrink: 0;
        }

        .check-row input:disabled {
          cursor: not-allowed;
        }

        .decision-actions {
          display: flex;
          gap: 16px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .btn-decide {
          flex: 1;
          min-width: 120px;
          padding: 12px 24px;
          border-radius: 999px;
          background: transparent;
          font-family: var(--font-body), sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            transform 0.25s ease,
            background-color 0.25s ease,
            color 0.25s ease,
            box-shadow 0.25s ease;
        }

        .btn-decide.accept {
          border: 1px solid rgba(27, 94, 59, 0.6);
          color: var(--av-emerald);
        }

        .btn-decide.accept:hover:not(:disabled) {
          transform: scale(1.03);
          background: var(--av-emerald);
          color: var(--av-warm);
          box-shadow: 0 6px 20px rgba(27, 94, 59, 0.3);
        }

        /* The selected choice stays filled so it is obvious before saving */
        .btn-decide.accept.chosen {
          background: var(--av-emerald);
          color: var(--av-warm);
          box-shadow: 0 6px 20px rgba(27, 94, 59, 0.3);
        }

        .btn-decide.reject {
          border: 1px solid rgba(139, 26, 26, 0.6);
          color: var(--av-crimson);
        }

        .btn-decide.reject:hover:not(:disabled) {
          transform: scale(1.03);
          background: var(--av-crimson);
          color: var(--av-warm);
          box-shadow: 0 6px 20px rgba(139, 26, 26, 0.3);
        }

        .btn-decide.reject.chosen {
          background: var(--av-crimson);
          color: var(--av-warm);
          box-shadow: 0 6px 20px rgba(139, 26, 26, 0.3);
        }

        .btn-decide:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* A chosen-but-locked button keeps its fill so the record stays legible */
        .btn-decide.chosen:disabled {
          opacity: 0.85;
        }

        .btn-save {
          width: 100%;
          padding: 14px 24px;
          border-radius: 999px;
          border: 1px solid transparent;
          background: var(--av-bronze);
          color: var(--av-warm);
          font-family: var(--font-body), sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .btn-save:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 8px 28px rgba(146, 121, 27, 0.4);
        }

        .btn-save:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* ---------- Application ---------- */
        .answer {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(201, 168, 76, 0.22);
        }

        .answer:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .answer h3 {
          margin: 0 0 8px;
          font-family: var(--font-body), sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--av-olive);
        }

        .answer p {
          margin: 0;
          font-family: var(--font-body), sans-serif;
          font-size: 14px;
          line-height: 1.7;
          color: var(--av-charcoal);
          white-space: pre-wrap;
        }

        .answer p.muted {
          font-style: italic;
          color: var(--av-olive);
        }

        .link-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .link-list a {
          font-family: var(--font-body), sans-serif;
          font-size: 14px;
          color: var(--av-emerald);
          text-decoration: underline;
          text-underline-offset: 3px;
          word-break: break-all;
        }

        .link-list a:hover {
          color: var(--av-bronze);
        }

        @media (prefers-reduced-motion: reduce) {
          .btn-decide,
          .btn-save {
            transition: none;
          }

          .btn-decide:hover:not(:disabled),
          .btn-save:hover:not(:disabled) {
            transform: none;
          }
        }

        @media (max-width: 768px) {
          .recruit-container {
            padding: 32px 16px 48px;
          }

          .recruit-header {
            padding: 32px 20px 24px;
          }

          .recruit-header h1 {
            font-size: 30px;
          }

          .recruit-tagline {
            font-size: 14px;
          }

          .recruit-grid {
            grid-template-columns: 1fr;
          }

          .panel {
            padding: 24px 20px;
          }

          .profile-list {
            grid-template-columns: 1fr;
          }

          .profile-list dt {
            padding-bottom: 0;
            border-bottom: none;
          }

          .decision-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
