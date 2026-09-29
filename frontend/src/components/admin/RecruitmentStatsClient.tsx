"use client";

import React, { useState, useEffect } from "react";
import { RECRUITMENT_DOMAINS } from "../../lib/validators/recruitment";
import { domainReadAliases } from "../../lib/utils/domains";
import RecruitmentCtaToggle from "../dashboard/RecruitmentCtaToggle";
import DashboardPageBackground from "../layout/DashboardPageBackground";
import recruitmentBackground from "../../../Admin_Dash_Img/4.png";

interface CounterStat {
  domain: string;
  not_sure: number;
  approved: number;
  rejected: number;
}

interface DomainIndicator {
  id: string;
  domain: string;
  indicator: boolean;
}

export default function RecruitmentStatsClient() {
  const [counters, setCounters] = useState<CounterStat[]>([]);
  const [domainIndicators, setDomainIndicators] = useState<DomainIndicator[]>(
    [],
  );
  const [selectedDomain, setSelectedDomain] = useState<
    (typeof RECRUITMENT_DOMAINS)[number]
  >(RECRUITMENT_DOMAINS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState<"open" | "close" | null>(null);
  const [togglingDomain, setTogglingDomain] = useState(false);
  const [flushingAll, setFlushingAll] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // WhatsApp link state
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [whatsappInput, setWhatsappInput] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [whatsappMsg, setWhatsappMsg] = useState("");

  const domainIndicatorActive = (domain: string) => {
    const canonical = domainIndicators.find((entry) => entry.domain === domain);
    if (canonical) return canonical.indicator;
    return domainReadAliases(domain).some((alias) =>
      domainIndicators.some(
        (entry) => entry.domain === alias && entry.indicator,
      ),
    );
  };

  // Fetch data on mount only; fetchData is intentionally excluded since it
  // is redefined every render and this effect must not re-run on refetch.
  useEffect(() => {
    fetchData();
    fetchWhatsappLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWhatsappLink = async () => {
    try {
      const res = await fetch("/api/recruitment/whatsapp");
      const data = await res.json();
      const url = String(data.url ?? "");
      setWhatsappUrl(url);
      setWhatsappInput(url);
    } catch {
      // non-critical
    }
  };

  const handleSaveWhatsapp = async () => {
    setSavingWhatsapp(true);
    setWhatsappMsg("");
    try {
      const res = await fetch("/api/recruitment/whatsapp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: whatsappInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setWhatsappUrl(String(data.url ?? ""));
      setWhatsappMsg("✓ WhatsApp link saved successfully");
    } catch (err) {
      setWhatsappMsg(
        `✕ ${err instanceof Error ? err.message : "Failed to save"}`,
      );
    } finally {
      setSavingWhatsapp(false);
      setTimeout(() => setWhatsappMsg(""), 4000);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [counterRes, indicatorRes] = await Promise.all([
        fetch("/api/recruitment/counter"),
        fetch("/api/recruitment/indicator"),
      ]);

      if (!counterRes.ok || !indicatorRes.ok)
        throw new Error("Failed to fetch data");

      const counterData = await counterRes.json();
      const indicatorData = await indicatorRes.json();

      setCounters(counterData.data || []);

      // Handle indicators - the API returns an array of domain indicators
      const indicatorsArray = Array.isArray(indicatorData.data)
        ? indicatorData.data
        : [];
      setDomainIndicators(indicatorsArray);

      if (!selectedDomain && RECRUITMENT_DOMAINS.length > 0) {
        setSelectedDomain(RECRUITMENT_DOMAINS[0]);
      }

      setError("");
    } catch (err) {
      setError("Failed to load recruitment stats");
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkToggleAllDomains = async (nextStatus: boolean) => {
    try {
      setBulkAction(nextStatus ? "open" : "close");
      setError("");
      setSuccess("");

      for (const domain of RECRUITMENT_DOMAINS) {
        const response = await fetch("/api/recruitment/indicator", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain, indicator: nextStatus }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update indicator for domain: ${domain}`);
        }
      }

      setDomainIndicators((currentIndicators) =>
        RECRUITMENT_DOMAINS.map((domain) => {
          const existing = currentIndicators.find(
            (entry) => entry.domain === domain,
          );
          return existing
            ? { ...existing, indicator: nextStatus }
            : { id: domain, domain, indicator: nextStatus };
        }),
      );

      setSuccess(
        `Recruitment ${nextStatus ? "opened" : "closed"} for all domains`,
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update all domains");
      console.error("Error bulk toggling indicators:", err);
    } finally {
      setBulkAction(null);
    }
  };

  const handleToggleSelectedDomainIndicator = async (nextStatus: boolean) => {
    try {
      setTogglingDomain(true);

      const response = await fetch("/api/recruitment/indicator", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: selectedDomain, indicator: nextStatus }),
      });

      if (!response.ok) throw new Error("Failed to update domain indicator");

      setDomainIndicators((currentIndicators) =>
        currentIndicators.some((entry) => entry.domain === selectedDomain)
          ? currentIndicators.map((entry) =>
              entry.domain === selectedDomain
                ? { ...entry, indicator: nextStatus }
                : entry,
            )
          : [
              ...currentIndicators,
              {
                id: selectedDomain,
                domain: selectedDomain,
                indicator: nextStatus,
              },
            ],
      );

      setSuccess(
        `Recruitment for ${selectedDomain} ${nextStatus ? "enabled" : "disabled"}`,
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update selected domain");
      console.error("Error toggling selected domain indicator:", err);
    } finally {
      setTogglingDomain(false);
    }
  };

  const handleFlushAllCounters = async () => {
    if (
      !confirm(
        "WARNING: This will migrate all approved applicants to the members table, clear ALL recruitment data, reset all domain counters, and CLOSE all recruitment domains. This action CANNOT be undone. Continue?",
      )
    ) {
      return;
    }

    try {
      setFlushingAll(true);
      setError("");
      setSuccess("");

      // Step 1: Flush recruitment data first
      if (process.env.NODE_ENV === "development") {
        console.log("Step 1: Flushing recruitment data...");
      }
      const recruitmentResponse = await fetch("/api/recruitment/flush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!recruitmentResponse.ok) {
        const errorData = await recruitmentResponse.json();
        throw new Error(
          errorData.details ||
            errorData.error ||
            "Failed to flush recruitment data",
        );
      }

      const recruitmentResult = await recruitmentResponse.json();

      // Step 2: Flush counters after recruitment data is cleared
      if (process.env.NODE_ENV === "development") {
        console.log("Step 2: Flushing all counters...");
      }
      const counterResponse = await fetch("/api/recruitment/counter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flushAll: true }),
      });

      if (!counterResponse.ok) {
        throw new Error("Failed to flush counters");
      }

      // Step 3: Close all domain indicators
      if (process.env.NODE_ENV === "development") {
        console.log("Step 3: Closing all domain indicators...");
      }
      for (const domain of RECRUITMENT_DOMAINS) {
        const indicatorResponse = await fetch("/api/recruitment/indicator", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain, indicator: false }),
        });

        if (!indicatorResponse.ok) {
          throw new Error(`Failed to close indicator for domain: ${domain}`);
        }
      }

      // All operations successful
      setSuccess(
        `Complete flush successful. Added ${recruitmentResult.stats.totalMembersAdded} new members (${recruitmentResult.stats.secondPreferenceMembers} second preference + ${recruitmentResult.stats.firstPreferenceMembers} first preference). All recruitment data and counters cleared, and recruitment domains closed.`,
      );

      // Refresh data to show updated stats
      setTimeout(() => fetchData(), 1000);

      // Clear success message after 6 seconds
      setTimeout(() => setSuccess(""), 6000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Flush failed: ${errorMessage}`);
      console.error("Error during flush operations:", err);
    } finally {
      setFlushingAll(false);
    }
  };

  const getTotal = (counter: CounterStat) =>
    counter.not_sure + counter.approved + counter.rejected;

  return (
    <>
      <DashboardPageBackground src={recruitmentBackground.src} />

      <main className="recruitment-container">
        <div className="recruitment-wrapper">
          <header className="recruitment-header">
            <span className="corner corner-tl" aria-hidden />
            <span className="corner corner-br" aria-hidden />

            <p className="recruitment-label">Avyakta Admin</p>
            <h1>Recruitment Management</h1>
            <p className="recruitment-tagline">
              Manage recruitment status and view application stats by domain.
            </p>

            <div className="rangoli" aria-hidden>
              <span className="dot small" />
              <span className="dot large" />
              <span className="dot small" />
            </div>
          </header>

          {/* WhatsApp Group Link Panel */}
          <div className="stats-header">
            <div className="header-left">
              <h3>📱 WhatsApp Group Link</h3>
              <p className="panel-hint">
                After submitting the recruitment form, applicants see this link
                to join the provisional members group. Leave blank to hide it.
              </p>
            </div>
            <div className="header-actions" style={{ flex: 1, maxWidth: 560 }}>
              <input
                type="url"
                value={whatsappInput}
                onChange={(e) => setWhatsappInput(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1px solid rgba(146,121,27,0.35)",
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: "var(--font-body), sans-serif",
                  color: "var(--av-charcoal)",
                  background: "#fff",
                  minWidth: 0,
                }}
              />
              <button
                onClick={handleSaveWhatsapp}
                className="btn-toggle-global active"
                disabled={savingWhatsapp}
              >
                {savingWhatsapp ? "Saving…" : "Save"}
              </button>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-refresh"
                  style={{ textDecoration: "none" }}
                >
                  Preview
                </a>
              )}
            </div>
            {whatsappMsg && (
              <div
                style={{
                  width: "100%",
                  marginTop: 8,
                  fontSize: 13,
                  fontFamily: "var(--font-body), sans-serif",
                  color: whatsappMsg.startsWith("✓")
                    ? "var(--av-emerald)"
                    : "var(--av-crimson)",
                }}
              >
                {whatsappMsg}
              </div>
            )}
          </div>

          <div className="stats-header">
            <div className="header-left">
              <h3>Recruitment Stats</h3>
            </div>
            <div className="header-actions">
              <RecruitmentCtaToggle variant="compact" />
              <button
                onClick={fetchData}
                className="btn-refresh"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
              <button
                onClick={() => handleBulkToggleAllDomains(true)}
                className="btn-toggle-global active"
                disabled={bulkAction !== null}
              >
                {bulkAction === "open" ? "Updating..." : "Open All"}
              </button>
              <button
                onClick={() => handleBulkToggleAllDomains(false)}
                className="btn-toggle-global"
                disabled={bulkAction !== null}
              >
                {bulkAction === "close" ? "Updating..." : "Close All"}
              </button>
              <button
                onClick={handleFlushAllCounters}
                className="btn-flush-all"
                disabled={flushingAll}
              >
                {flushingAll ? "Processing..." : "Flush All"}
              </button>
            </div>
          </div>

          <div className="stats-header">
            <div className="header-left">
              <h3>Domain Control</h3>
              <p className="panel-hint">
                Pick a domain and open or close recruitment for that specific
                team.
              </p>
            </div>
            <div className="header-actions">
              <select
                value={selectedDomain}
                onChange={(event) =>
                  setSelectedDomain(
                    event.target.value as (typeof RECRUITMENT_DOMAINS)[number],
                  )
                }
                className="domain-select"
              >
                {RECRUITMENT_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleToggleSelectedDomainIndicator(true)}
                className="btn-toggle-global"
                disabled={togglingDomain}
              >
                {togglingDomain ? "Updating..." : "Open Selected"}
              </button>
              <button
                onClick={() => handleToggleSelectedDomainIndicator(false)}
                className="btn-flush-all"
                disabled={togglingDomain}
              >
                {togglingDomain ? "Updating..." : "Close Selected"}
              </button>
            </div>
          </div>

          <div className="selected-domain-panel">
            <div>
              <p className="selected-domain-label">Selected domain</p>
              <p className="selected-domain-name">{selectedDomain}</p>
            </div>
            <div className="selected-domain-state">
              <span
                className={`indicator-dot ${domainIndicatorActive(selectedDomain) ? "active" : ""}`}
              />
              <span>
                {domainIndicatorActive(selectedDomain) ? "Open" : "Closed"}
              </span>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="recruitment-grid">
            {RECRUITMENT_DOMAINS.map((domain) => {
              const counter = counters.find((c) => c.domain === domain);
              const isActive = domainIndicatorActive(domain);
              const total = counter ? getTotal(counter) : 0;

              return (
                <div
                  key={domain}
                  className={`recruitment-card ${isActive ? "active" : "inactive"}`}
                >
                  <div className="card-header">
                    <div className="domain-title">
                      <h4>{domain}</h4>
                      <span
                        className={`domain-indicator ${isActive ? "active" : ""}`}
                      >
                        {isActive ? "Open" : "Closed"}
                      </span>
                    </div>
                  </div>

                  <div className="stats-section">
                    <div className="stat-row total">
                      <span className="stat-label">Total</span>
                      <span className="stat-value">{total}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Approved</span>
                      <span className="stat-value approved">
                        {counter?.approved || 0}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Pending</span>
                      <span className="stat-value waiting">
                        {counter?.not_sure || 0}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Rejected</span>
                      <span className="stat-value rejected">
                        {counter?.rejected || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <style jsx>{`
          .recruitment-container {
            position: relative;
            z-index: 1;
            min-height: 100vh;
            padding: 48px 24px 64px;
          }

          .recruitment-wrapper {
            max-width: 1280px;
            margin: 0 auto;
          }

          /* ---------- Header ---------- */
          .recruitment-header {
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

          .recruitment-label {
            margin: 0;
            font-family: var(--font-body), sans-serif;
            font-size: 11px;
            font-weight: 600;
            color: var(--av-olive);
            letter-spacing: 5px;
            text-transform: uppercase;
          }

          .recruitment-header h1 {
            margin: 12px 0 8px;
            font-family: var(--font-heading), serif;
            font-size: 44px;
            font-weight: 600;
            color: var(--av-bronze);
            letter-spacing: 0.5px;
          }

          .recruitment-tagline {
            margin: 0;
            font-family: var(--font-accent), serif;
            font-style: italic;
            font-size: 16px;
            color: rgba(28, 28, 28, 0.7);
          }

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

          /* ---------- Control panels ---------- */
          .stats-header,
          .selected-domain-panel {
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
            margin-bottom: 24px;
            box-shadow: 0 16px 40px rgba(28, 28, 28, 0.35);
          }

          /* Gold accent along the top edge */
          .stats-header::before,
          .selected-domain-panel::before {
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

          .header-left {
            min-width: 0;
          }

          .header-left h3 {
            margin: 0;
            font-family: var(--font-heading), serif;
            font-size: 26px;
            font-weight: 600;
            color: var(--av-bronze);
          }

          .header-left .panel-hint {
            margin: 6px 0 0;
            font-family: var(--font-body), sans-serif;
            font-size: 13px;
            color: var(--av-olive);
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          /* ---------- Buttons ---------- */
          .btn-refresh,
          .btn-toggle-global,
          .btn-flush-all {
            padding: 10px 22px;
            border-radius: 999px;
            border: 1px solid transparent;
            background: transparent;
            font-family: var(--font-body), sans-serif;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            cursor: pointer;
            white-space: nowrap;
            transition:
              transform 0.25s ease,
              background-color 0.25s ease,
              color 0.25s ease,
              box-shadow 0.25s ease;
          }

          .btn-refresh {
            border-color: rgba(115, 121, 85, 0.6);
            color: var(--av-olive);
          }

          .btn-refresh:hover:not(:disabled) {
            background: rgba(115, 121, 85, 0.15);
            color: var(--av-charcoal);
          }

          /* "Close" style — quiet outline */
          .btn-toggle-global {
            border-color: rgba(146, 121, 27, 0.5);
            color: var(--av-bronze);
          }

          .btn-toggle-global:hover:not(:disabled) {
            transform: scale(1.03);
            background: var(--av-bronze);
            color: var(--av-warm);
            box-shadow: 0 6px 20px rgba(146, 121, 27, 0.35);
          }

          /* "Open" style — emerald, the affirmative action */
          .btn-toggle-global.active {
            border-color: rgba(27, 94, 59, 0.6);
            color: var(--av-emerald);
          }

          .btn-toggle-global.active:hover:not(:disabled) {
            background: var(--av-emerald);
            color: var(--av-warm);
            box-shadow: 0 6px 20px rgba(27, 94, 59, 0.35);
          }

          /* Destructive */
          .btn-flush-all {
            border-color: rgba(139, 26, 26, 0.6);
            color: var(--av-crimson);
          }

          .btn-flush-all:hover:not(:disabled) {
            transform: scale(1.03);
            background: var(--av-crimson);
            color: var(--av-warm);
            box-shadow: 0 6px 20px rgba(139, 26, 26, 0.35);
          }

          .btn-refresh:disabled,
          .btn-toggle-global:disabled,
          .btn-flush-all:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .domain-select {
            min-width: 240px;
            padding: 11px 14px;
            border: 1px solid rgba(146, 121, 27, 0.35);
            border-radius: 10px;
            background: #ffffff;
            font-family: var(--font-body), sans-serif;
            font-size: 14px;
            font-weight: 500;
            color: var(--av-charcoal);
            cursor: pointer;
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .domain-select:focus {
            outline: none;
            border-color: var(--av-gold);
            box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.25);
          }

          /* ---------- Selected domain readout ---------- */
          .selected-domain-label {
            margin: 0;
            font-family: var(--font-body), sans-serif;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--av-olive);
          }

          .selected-domain-name {
            margin: 6px 0 0;
            font-family: var(--font-heading), serif;
            font-size: 24px;
            font-weight: 600;
            color: var(--av-charcoal);
          }

          .selected-domain-state {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 18px;
            border-radius: 999px;
            background: rgba(146, 121, 27, 0.1);
            border: 1px solid rgba(146, 121, 27, 0.28);
            font-family: var(--font-body), sans-serif;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: var(--av-olive);
          }

          .indicator-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(115, 121, 85, 0.6);
            flex-shrink: 0;
          }

          .indicator-dot.active {
            background: var(--av-emerald);
            box-shadow: 0 0 0 3px rgba(27, 94, 59, 0.2);
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

          /* ---------- Domain cards ---------- */
          .recruitment-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 24px;
            margin-top: 32px;
          }

          .recruitment-card {
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

          /* Top rail states whether the domain is accepting applications */
          .recruitment-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
          }

          .recruitment-card.active::before {
            background: linear-gradient(
              90deg,
              transparent,
              var(--av-emerald),
              transparent
            );
          }

          .recruitment-card.inactive::before {
            background: linear-gradient(
              90deg,
              transparent,
              rgba(115, 121, 85, 0.7),
              transparent
            );
          }

          /* Faint textile weave */
          .recruitment-card::after {
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

          .recruitment-card.inactive {
            opacity: 0.88;
          }

          .recruitment-card:hover {
            transform: translateY(-6px) scale(1.02);
            box-shadow: 0 24px 56px rgba(201, 168, 76, 0.3);
          }

          .card-header {
            position: relative;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid rgba(201, 168, 76, 0.3);
          }

          .domain-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .domain-title h4 {
            margin: 0;
            font-family: var(--font-heading), serif;
            font-size: 22px;
            font-weight: 600;
            color: var(--av-bronze);
            /* Reserve two lines so a wrapping domain name keeps its divider
               aligned with the single-line cards beside it. */
            line-height: 1.25;
            min-height: 2.5em;
            display: flex;
            align-items: center;
          }

          .domain-indicator {
            flex-shrink: 0;
            padding: 4px 12px;
            border-radius: 999px;
            font-family: var(--font-body), sans-serif;
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            background: rgba(115, 121, 85, 0.12);
            border: 1px solid rgba(115, 121, 85, 0.45);
            color: var(--av-olive);
          }

          .domain-indicator.active {
            background: rgba(27, 94, 59, 0.12);
            border-color: rgba(27, 94, 59, 0.45);
            color: var(--av-emerald);
          }

          /* ---------- Stats ---------- */
          .stats-section {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .stat-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .stat-row.total {
            padding-bottom: 12px;
            margin-bottom: 4px;
            border-bottom: 1px solid rgba(201, 168, 76, 0.25);
          }

          .stat-label {
            font-family: var(--font-body), sans-serif;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--av-olive);
          }

          .stat-value {
            font-family: var(--font-heading), serif;
            /* Cormorant defaults to old-style figures, which makes "1" read as
             "I" and drops "5" below the baseline — force lining numerals. */
            font-variant-numeric: lining-nums tabular-nums;
            font-size: 22px;
            font-weight: 600;
            line-height: 1;
            color: var(--av-charcoal);
          }

          .stat-row.total .stat-value {
            font-size: 32px;
            color: var(--av-bronze);
          }

          .stat-value.approved {
            color: var(--av-emerald);
          }

          .stat-value.waiting {
            color: var(--av-olive);
          }

          .stat-value.rejected {
            color: var(--av-crimson);
          }

          @media (prefers-reduced-motion: reduce) {
            .recruitment-card,
            .btn-refresh,
            .btn-toggle-global,
            .btn-flush-all {
              transition: none;
            }

            .recruitment-card:hover,
            .btn-toggle-global:hover:not(:disabled),
            .btn-flush-all:hover:not(:disabled) {
              transform: none;
            }
          }

          @media (max-width: 768px) {
            .recruitment-container {
              padding: 32px 16px 48px;
            }

            .recruitment-header {
              padding: 32px 20px 24px;
            }

            .recruitment-header h1 {
              font-size: 32px;
            }

            .recruitment-tagline {
              font-size: 14px;
            }

            .stats-header,
            .selected-domain-panel {
              flex-direction: column;
              align-items: stretch;
            }

            .header-actions {
              flex-direction: column;
              align-items: stretch;
            }

            .domain-select {
              min-width: 0;
              width: 100%;
            }

            .recruitment-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>
    </>
  );
}
