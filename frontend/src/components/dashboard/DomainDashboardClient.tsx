"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import IndicatorBuzzer from "./IndicatorBuzzer";
import { formatDomainFromUrl } from "@/lib/utils/domainFormatter";
import DomainTopBar from "../domain/DomainTopBar";
import DashboardPageBackground from "../layout/DashboardPageBackground";
import domainBackground from "../../../Domain_Dash_Img/image-1.png";

type RecruitRow = {
  id: string;
  name: string;
  srn: string;
  email: string;
  phone_no: string;
  year: number;
  branch: string;
  section: string;
  links: string | null;
  experience: string | null;
  why_you: string;
  why_us: string;
  first_preference_status: string | null;
  second_preference_status?: string | null;
  second_preference_interview?: boolean | null;
  first_preference_domain: string;
  second_domain_preference: string | null;
  interview: boolean | null;
};

type CounterRow = {
  domain: string;
  not_sure: number;
  approved: number;
  rejected: number;
};

type IndicatorRow = {
  id: string;
  domain: string;
  indicator: boolean;
};

const normalizeStatus = (status: string | null | undefined) =>
  status === "not_sure" || !status ? "pending" : status;

const isPendingStatus = (status: string | null | undefined) =>
  normalizeStatus(status) === "pending";

function StatusPill({
  status,
  interviewed = false,
}: {
  status: string | null | undefined;
  interviewed?: boolean;
}) {
  // Interview done but no accept/reject yet reads as its own state.
  const value =
    isPendingStatus(status) && interviewed
      ? "interviewed"
      : normalizeStatus(status);
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  return <span className={`status-pill ${value}`}>{label}</span>;
}

function RecruitAction({
  status,
  interviewed = false,
  isRecruitmentOpen,
  href,
}: {
  status: string | null | undefined;
  interviewed?: boolean;
  isRecruitmentOpen: boolean;
  href: string;
}) {
  if (!isPendingStatus(status)) {
    return <span className="action-note">Finalized</span>;
  }

  if (!isRecruitmentOpen) {
    return <span className="action-note">Awaiting</span>;
  }

  return (
    <Link href={href} className="btn-review">
      {interviewed ? "Decide" : "Review"}
    </Link>
  );
}

type DomainDashboardClientProps = {
  domain: string;
};

export default function DomainDashboardClient({
  domain,
}: DomainDashboardClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstPreferenceRecruits, setFirstPreferenceRecruits] = useState<
    RecruitRow[]
  >([]);
  const [secondPreferenceRecruits, setSecondPreferenceRecruits] = useState<
    RecruitRow[]
  >([]);
  const [counter, setCounter] = useState<CounterRow | null>(null);
  const [indicator, setIndicator] = useState<IndicatorRow | null>(null);

  // `domain` is the URL slug ("event-management"); this is what people read.
  const domainName = formatDomainFromUrl(domain);

  useEffect(() => {
    const loadDomainData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/domain/${domain}/recruits`);
        if (!response.ok) {
          throw new Error("Failed to load domain data");
        }

        const payload = await response.json();

        setFirstPreferenceRecruits(payload.firstPreference ?? []);
        setSecondPreferenceRecruits(payload.secondPreference ?? []);
        setCounter(payload.counter ?? null);
        setIndicator(payload.indicator ?? null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load domain data",
        );
      } finally {
        setLoading(false);
      }
    };

    if (domain) {
      loadDomainData();
    }
  }, [domain]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const marginX = 14;
    let y = 16;

    doc.setFontSize(16);
    doc.text(`${domainName} - Recruitment Report`, marginX, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y);

    const toRow = (
      recruit: RecruitRow,
      preference: "First" | "Second",
      status: string,
    ) => [
      recruit.name || "N/A",
      recruit.srn || "N/A",
      recruit.email || "N/A",
      recruit.phone_no || "N/A",
      recruit.branch || "N/A",
      recruit.section || "N/A",
      recruit.year != null ? String(recruit.year) : "N/A",
      preference,
      status,
    ];

    const rows = [
      ...firstPreferenceRecruits.map((recruit) =>
        toRow(
          recruit,
          "First",
          normalizeStatus(recruit.first_preference_status),
        ),
      ),
      ...secondPreferenceRecruits.map((recruit) =>
        toRow(
          recruit,
          "Second",
          normalizeStatus(recruit.second_preference_status),
        ),
      ),
    ];

    autoTable(doc, {
      startY: y + 6,
      head: [
        [
          "Name",
          "SRN",
          "Email",
          "Phone",
          "Branch",
          "Section",
          "Year",
          "Preference",
          "Status",
        ],
      ],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [146, 121, 27] },
    });

    doc.save(`${domainName.replace(/\s+/g, "_")}_Recruitment_Report.pdf`);
  };

  const hasRecruits =
    firstPreferenceRecruits.length > 0 || secondPreferenceRecruits.length > 0;

  return (
    <>
      <DashboardPageBackground src={domainBackground.src} />
      <DomainTopBar domainName={domainName} />

      <main className="domain-container">
        <div className="domain-wrapper">
          <header className="domain-header">
            <span className="corner corner-tl" aria-hidden />
            <span className="corner corner-br" aria-hidden />

            <p className="domain-label">Avyakta Domain</p>
            <h1>{domainName}</h1>
            <p className="domain-tagline">
              Recruitment summary for this domain.
            </p>

            <div className="rangoli" aria-hidden>
              <span className="dot small" />
              <span className="dot large" />
              <span className="dot small" />
            </div>

            <div className="header-actions">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={loading || !hasRecruits}
                className="btn-report"
              >
                Download Report
              </button>
            </div>
          </header>

          {loading && <div className="state-panel">Loading recruits...</div>}

          {error && !loading && (
            <div className="state-panel error">{error}</div>
          )}

          {!loading && !error && (
            <>
              <section className="stats-grid">
                <article className="stat-card pending">
                  <span className="stat-label">Pending</span>
                  <span className="stat-value">{counter?.not_sure ?? 0}</span>
                </article>
                <article className="stat-card approved">
                  <span className="stat-label">Approved</span>
                  <span className="stat-value">{counter?.approved ?? 0}</span>
                </article>
                <article className="stat-card rejected">
                  <span className="stat-label">Rejected</span>
                  <span className="stat-value">{counter?.rejected ?? 0}</span>
                </article>
              </section>

              {indicator && (
                <section className="status-panel">
                  <div>
                    <h2>Recruitment Status</h2>
                    <p className="panel-hint">
                      Only the admin dashboard can open recruitment. You can
                      close it from here once it&apos;s open.
                    </p>
                  </div>
                  <IndicatorBuzzer
                    domain={domainName}
                    initialStatus={indicator.indicator}
                    mode="domain"
                    direction="close"
                    onUpdated={(nextStatus) =>
                      setIndicator((prev) =>
                        prev ? { ...prev, indicator: nextStatus } : prev,
                      )
                    }
                  />
                </section>
              )}

              <div className="tables-stack">
                <section className="table-card">
                  <div className="table-head">
                    <h2>First Preference</h2>
                    <span className="row-count">
                      {firstPreferenceRecruits.length}
                    </span>
                  </div>
                  <div className="table-scroll">
                    <table className="recruit-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>SRN</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {firstPreferenceRecruits.map((recruit) => (
                          <tr key={recruit.id}>
                            <td className="cell-name">{recruit.name}</td>
                            <td className="cell-srn">{recruit.srn}</td>
                            <td>
                              <StatusPill
                                status={recruit.first_preference_status}
                                interviewed={Boolean(recruit.interview)}
                              />
                            </td>
                            <td>
                              <RecruitAction
                                status={recruit.first_preference_status}
                                interviewed={Boolean(recruit.interview)}
                                isRecruitmentOpen={Boolean(
                                  indicator?.indicator,
                                )}
                                href={`/domain/${domain}/${recruit.id}`}
                              />
                            </td>
                          </tr>
                        ))}
                        {firstPreferenceRecruits.length === 0 && (
                          <tr>
                            <td className="empty-row" colSpan={4}>
                              No first-preference applicants yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="table-card">
                  <div className="table-head">
                    <h2>Second Preference</h2>
                    <span className="row-count">
                      {secondPreferenceRecruits.length}
                    </span>
                  </div>
                  <div className="table-scroll">
                    <table className="recruit-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>SRN</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {secondPreferenceRecruits.map((recruit) => (
                          <tr key={recruit.id}>
                            <td className="cell-name">{recruit.name}</td>
                            <td className="cell-srn">{recruit.srn}</td>
                            <td>
                              <StatusPill
                                status={recruit.second_preference_status}
                                interviewed={Boolean(
                                  recruit.second_preference_interview,
                                )}
                              />
                            </td>
                            <td>
                              <RecruitAction
                                status={recruit.second_preference_status}
                                interviewed={Boolean(
                                  recruit.second_preference_interview,
                                )}
                                isRecruitmentOpen={Boolean(
                                  indicator?.indicator,
                                )}
                                href={`/domain/${domain}/${recruit.id}`}
                              />
                            </td>
                          </tr>
                        ))}
                        {secondPreferenceRecruits.length === 0 && (
                          <tr>
                            <td className="empty-row" colSpan={4}>
                              No second-preference applicants yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </main>

      <style jsx>{`
        .domain-container {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          padding: 48px 24px 64px;
        }

        .domain-wrapper {
          max-width: 1280px;
          margin: 0 auto;
        }

        /* ---------- Header ---------- */
        .domain-header {
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

        .domain-label {
          margin: 0;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--av-olive);
          letter-spacing: 5px;
          text-transform: uppercase;
        }

        .domain-header h1 {
          margin: 12px 0 8px;
          font-family: var(--font-heading), serif;
          font-size: 44px;
          font-weight: 600;
          color: var(--av-bronze);
          letter-spacing: 0.5px;
          line-height: 1.15;
        }

        .domain-tagline {
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

        .header-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .btn-report {
          padding: 12px 28px;
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
            box-shadow 0.25s ease,
            background-color 0.25s ease;
        }

        .btn-report:hover:not(:disabled) {
          transform: scale(1.03);
          box-shadow: 0 8px 28px rgba(146, 121, 27, 0.4);
        }

        .btn-report:disabled {
          background: transparent;
          border-color: rgba(115, 121, 85, 0.5);
          color: var(--av-olive);
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ---------- Loading / error ---------- */
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

        /* ---------- Stat cards ---------- */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card {
          position: relative;
          background: var(--av-warm);
          border: 1px solid rgba(146, 121, 27, 0.3);
          border-radius: 16px;
          padding: 24px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(28, 28, 28, 0.35);
          transition:
            transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.3s ease;
        }

        /* Top rail carries the meaning of the number below it */
        .stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
        }

        .stat-card.pending::before {
          background: linear-gradient(
            90deg,
            transparent,
            var(--av-gold),
            transparent
          );
        }

        .stat-card.approved::before {
          background: linear-gradient(
            90deg,
            transparent,
            var(--av-emerald),
            transparent
          );
        }

        .stat-card.rejected::before {
          background: linear-gradient(
            90deg,
            transparent,
            var(--av-crimson),
            transparent
          );
        }

        /* Faint textile weave */
        .stat-card::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.05;
          background-image: repeating-linear-gradient(
            45deg,
            rgba(146, 121, 27, 0.8) 0,
            rgba(146, 121, 27, 0.8) 1px,
            transparent 1px,
            transparent 12px
          );
        }

        .stat-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 24px 56px rgba(201, 168, 76, 0.3);
        }

        .stat-label {
          position: relative;
          font-family: var(--font-body), sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--av-olive);
        }

        .stat-value {
          position: relative;
          display: block;
          margin-top: 12px;
          font-family: var(--font-heading), serif;
          /* Cormorant defaults to old-style figures, which makes "1" read as
             "I" and drops "5" below the baseline — force lining numerals. */
          font-variant-numeric: lining-nums tabular-nums;
          font-size: 44px;
          font-weight: 600;
          line-height: 1;
        }

        .stat-card.pending .stat-value {
          color: var(--av-bronze);
        }

        .stat-card.approved .stat-value {
          color: var(--av-emerald);
        }

        .stat-card.rejected .stat-value {
          color: var(--av-crimson);
        }

        /* ---------- Recruitment status ---------- */
        .status-panel {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          background: var(--av-warm);
          border: 1px solid rgba(146, 121, 27, 0.3);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
          box-shadow: 0 16px 40px rgba(28, 28, 28, 0.35);
        }

        .status-panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 16px 16px 0 0;
          background: linear-gradient(
            90deg,
            transparent,
            var(--av-gold),
            transparent
          );
        }

        .status-panel h2 {
          margin: 0;
          font-family: var(--font-heading), serif;
          font-size: 26px;
          font-weight: 600;
          color: var(--av-bronze);
        }

        .panel-hint {
          margin: 6px 0 0;
          font-family: var(--font-body), sans-serif;
          font-size: 13px;
          color: var(--av-olive);
          max-width: 60ch;
        }

        /* ---------- Recruit tables ---------- */
        .tables-stack {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .table-card {
          position: relative;
          background: var(--av-warm);
          border: 1px solid rgba(146, 121, 27, 0.3);
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(28, 28, 28, 0.35);
          overflow: hidden;
        }

        .table-card::before {
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

        .table-head {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px;
          border-bottom: 1px solid rgba(201, 168, 76, 0.35);
        }

        .table-head h2 {
          margin: 0;
          font-family: var(--font-heading), serif;
          font-size: 26px;
          font-weight: 600;
          color: var(--av-bronze);
        }

        .row-count {
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

        .table-scroll {
          overflow-x: auto;
        }

        .recruit-table {
          width: 100%;
          border-collapse: collapse;
        }

        .recruit-table th {
          padding: 18px 24px;
          text-align: left;
          font-family: var(--font-body), sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--av-olive);
          background: rgba(146, 121, 27, 0.08);
          border-bottom: 1px solid rgba(201, 168, 76, 0.4);
          white-space: nowrap;
        }

        .recruit-table td {
          padding: 18px 24px;
          font-family: var(--font-body), sans-serif;
          font-size: 14px;
          color: var(--av-charcoal);
          border-bottom: 1px solid rgba(201, 168, 76, 0.22);
          vertical-align: middle;
        }

        .recruit-table tbody tr {
          transition: background-color 0.25s ease;
        }

        .recruit-table tbody tr:hover {
          background: rgba(201, 168, 76, 0.1);
        }

        .recruit-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* Qualified with the table so these outrank the generic td rule,
           which otherwise forces the body font back onto the cell. */
        .recruit-table td.cell-name {
          font-family: var(--font-heading), serif;
          font-size: 18px;
          font-weight: 600;
        }

        .recruit-table td.cell-srn {
          font-variant-numeric: lining-nums tabular-nums;
          letter-spacing: 0.5px;
          color: rgba(28, 28, 28, 0.7);
          white-space: nowrap;
        }

        .recruit-table td.empty-row {
          font-family: var(--font-accent), serif;
          font-style: italic;
          color: var(--av-olive);
          text-align: center;
          padding: 32px 24px;
        }

        /* ---------- Status pills ---------- */
        .status-pill {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 999px;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .status-pill.pending {
          background: rgba(201, 168, 76, 0.14);
          border: 1px solid rgba(201, 168, 76, 0.5);
          color: var(--av-bronze);
        }

        .status-pill.interviewed {
          background: rgba(146, 121, 27, 0.18);
          border: 1px solid rgba(146, 121, 27, 0.65);
          color: var(--av-bronze);
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

        .action-note {
          font-family: var(--font-body), sans-serif;
          font-size: 12px;
          font-style: italic;
          color: var(--av-olive);
        }

        /* next/link renders a custom component, so styled-jsx never adds its
           scoping class to the anchor. Scope through the parent instead. */
        .recruit-table :global(.btn-review) {
          display: inline-block;
          padding: 7px 18px;
          border-radius: 999px;
          border: 1px solid rgba(146, 121, 27, 0.5);
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--av-bronze);
          text-decoration: none;
          white-space: nowrap;
          transition:
            background-color 0.25s ease,
            color 0.25s ease,
            box-shadow 0.25s ease;
        }

        .recruit-table :global(.btn-review:hover) {
          background: var(--av-bronze);
          color: var(--av-warm);
          box-shadow: 0 6px 20px rgba(146, 121, 27, 0.35);
        }

        @media (prefers-reduced-motion: reduce) {
          .stat-card,
          .btn-report,
          .recruit-table tbody tr {
            transition: none;
          }

          .stat-card:hover,
          .btn-report:hover:not(:disabled) {
            transform: none;
          }
        }

        @media (max-width: 768px) {
          .domain-container {
            padding: 32px 16px 48px;
          }

          .domain-header {
            padding: 32px 20px 24px;
          }

          .domain-header h1 {
            font-size: 30px;
          }

          .domain-tagline {
            font-size: 14px;
          }

          .header-actions {
            flex-direction: column;
          }

          .btn-report {
            width: 100%;
          }

          .status-panel {
            flex-direction: column;
            align-items: stretch;
          }

          .recruit-table th,
          .recruit-table td {
            padding: 14px 16px;
          }

          .recruit-table td.cell-name {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}
