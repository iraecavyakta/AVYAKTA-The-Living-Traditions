"use client";

import { useEffect, useState } from "react";
import MemberForm from "./MemberForm";
import MembersTable from "./MembersTable";
import DashboardPageBackground from "../layout/DashboardPageBackground";
import membersBackground from "../../../Admin_Dash_Img/1.png";
import { canonicalDomainName } from "../../lib/utils/domains";

interface Member {
  id: string;
  name: string;
  domain: string;
  role: string;
  photo_url?: string;
  tags?: string[];
  year?: number | null;
}

interface FormData {
  name: string;
  domain: string;
  role: string;
  photo_url?: string;
  tags: string[];
  year: number | null;
}

export default function AdminMembersClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"add" | "view">("view");

  // Fetch all members
  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/members", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch members");
      }

      setMembers(result.data || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch members");
    }
  };

  // Handle form submission (add or update)
  const handleFormSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");

      if (editingMember) {
        // Update member
        const response = await fetch(`/api/members/${editingMember.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to update member");
        }

        setMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? result.data : m)),
        );
        setSuccessMessage("Member updated successfully!");
        setEditingMember(null);
        setActiveTab("view");
      } else {
        // Create new member
        const response = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to create member");
        }

        setMembers((prev) => [...prev, result.data]);
        setSuccessMessage("Member added successfully!");
        setActiveTab("view");
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete member
  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) {
      return;
    }

    try {
      setIsDeletingId(id);
      const response = await fetch(`/api/members/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to delete member");
      }

      setMembers((prev) => prev.filter((m) => m.id !== id));
      setSuccessMessage("Member deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete member");
    } finally {
      setIsDeletingId(null);
    }
  };

  // Handle edit member
  const handleEditMember = (member: Member) => {
    setEditingMember({ ...member, domain: canonicalDomainName(member.domain) });
    setActiveTab("add");
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditingMember(null);
    setError("");
  };

  // Group members by domain
  const membersByDomain = members.reduce(
    (acc, member) => {
      const domain = canonicalDomainName(member.domain);
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push({ ...member, domain });
      return acc;
    },
    {} as Record<string, Member[]>,
  );

  // Get sorted domains
  const sortedDomains = Object.keys(membersByDomain).sort();

  // Calculate domain heads names and members count per domain
  const domainStats = sortedDomains.map((domain) => {
    const domainMembers = membersByDomain[domain];
    const heads = domainMembers
      .filter((m) => m.role === "domain_head")
      .map((m) => m.name);
    const memberCount = domainMembers.filter(
      (m) => m.role === "members",
    ).length;
    return {
      domain,
      heads,
      memberCount,
    };
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <>
      <DashboardPageBackground src={membersBackground.src} />

      <main className="members-container">
        <div className="members-wrapper">
          <header className="members-header">
            <span className="corner corner-tl" aria-hidden />
            <span className="corner corner-br" aria-hidden />

            <p className="members-label">Avyakta Admin</p>
            <h1>Members Management</h1>
            <p className="members-tagline">
              Add, view, update, and delete club members and their roles.
            </p>

            <div className="rangoli" aria-hidden>
              <span className="dot small" />
              <span className="dot large" />
              <span className="dot small" />
            </div>
          </header>

          {error && <div className="alert alert-error">{error}</div>}
          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}

          {/* Tabs */}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === "add" ? "active" : ""}`}
              onClick={() => setActiveTab("add")}
            >
              {editingMember ? "Edit Member" : "Add Member"}
            </button>
            <button
              className={`tab-button ${activeTab === "view" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("view");
                setEditingMember(null);
              }}
            >
              View Members ({members.length})
            </button>
          </div>

          <div className="members-content">
            {/* Add/Edit Section */}
            {activeTab === "add" && (
              <div className="section add-section">
                <MemberForm
                  member={editingMember || undefined}
                  onSubmit={handleFormSubmit}
                  onCancel={handleCancel}
                  isLoading={isSubmitting}
                />
              </div>
            )}

            {/* View Section */}
            {activeTab === "view" && (
              <div className="section view-section">
                {/* Domain Statistics Cards */}
                <div className="domain-stats-container">
                  {domainStats.map((stat) => (
                    <article key={stat.domain} className="domain-card">
                      <div className="card-header">
                        <h3>{stat.domain}</h3>
                      </div>
                      <div className="card-stats">
                        <div className="heads-section">
                          <span className="section-label">Heads</span>
                          <div className="heads-list">
                            {stat.heads.length > 0 ? (
                              stat.heads.map((name, idx) => (
                                <div key={idx} className="head-name">
                                  {name}
                                </div>
                              ))
                            ) : (
                              <div className="head-name empty">
                                No heads assigned
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="members-count">
                          <span className="section-label">Members</span>
                          <span className="count-value">
                            {stat.memberCount}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Members Display by Domain */}
                <div className="members-by-category">
                  {sortedDomains.map((domain) => (
                    <section key={domain} className="category-section">
                      <h3 className="category-title">
                        {domain}
                        <span className="category-count">
                          {membersByDomain[domain].length}
                        </span>
                      </h3>
                      <MembersTable
                        members={membersByDomain[domain]}
                        onEdit={handleEditMember}
                        onDelete={handleDeleteMember}
                        isDeleting={isDeletingId}
                      />
                    </section>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .members-container {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          padding: 48px 24px 64px;
        }

        .members-wrapper {
          max-width: 1280px;
          margin: 0 auto;
        }

        /* ---------- Header ---------- */
        .members-header {
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

        .members-label {
          margin: 0;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--av-olive);
          letter-spacing: 5px;
          text-transform: uppercase;
        }

        .members-header h1 {
          margin: 12px 0 8px;
          font-family: var(--font-heading), serif;
          font-size: 44px;
          font-weight: 600;
          color: var(--av-bronze);
          letter-spacing: 0.5px;
        }

        .members-tagline {
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

        /* ---------- Tabs ---------- */
        .tabs-container {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .tab-button {
          padding: 12px 28px;
          border-radius: 999px;
          border: 1px solid rgba(201, 168, 76, 0.45);
          background: rgba(245, 240, 232, 0.08);
          font-family: var(--font-body), sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.75);
          cursor: pointer;
          transition:
            transform 0.25s ease,
            background-color 0.25s ease,
            color 0.25s ease,
            box-shadow 0.25s ease;
        }

        .tab-button:hover {
          transform: scale(1.03);
          color: var(--av-warm);
          box-shadow: 0 8px 24px rgba(201, 168, 76, 0.25);
        }

        .tab-button.active {
          background: var(--av-bronze);
          border-color: var(--av-bronze);
          color: var(--av-warm);
          box-shadow: 0 8px 28px rgba(146, 121, 27, 0.4);
        }

        /* ---------- Sections ---------- */
        .members-content {
          animation: fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .section {
          animation: fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ---------- Domain stat cards ---------- */
        .domain-stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .domain-card {
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

        /* Gold accent along the top edge */
        .domain-card::before {
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

        /* Faint textile weave */
        .domain-card::after {
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

        .domain-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 24px 56px rgba(201, 168, 76, 0.3);
        }

        .card-header {
          position: relative;
          margin-bottom: 16px;
        }

        .card-header h3 {
          margin: 0;
          font-family: var(--font-heading), serif;
          font-size: 24px;
          font-weight: 600;
          color: var(--av-bronze);
        }

        .card-stats {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .heads-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .section-label {
          font-family: var(--font-body), sans-serif;
          font-size: 10px;
          font-weight: 600;
          color: var(--av-olive);
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .heads-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .head-name {
          background: rgba(146, 121, 27, 0.1);
          border: 1px solid rgba(146, 121, 27, 0.25);
          padding: 8px 12px;
          border-radius: 8px;
          font-family: var(--font-body), sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--av-charcoal);
          word-break: break-word;
        }

        .head-name.empty {
          background: transparent;
          border-style: dashed;
          color: var(--av-olive);
          font-style: italic;
          font-size: 12px;
        }

        .members-count {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid rgba(146, 121, 27, 0.2);
        }

        .count-value {
          font-family: var(--font-heading), serif;
          /* Cormorant defaults to old-style figures, which makes "1" read as
             "I" and drops "5" below the baseline — force lining numerals. */
          font-variant-numeric: lining-nums tabular-nums;
          font-size: 32px;
          font-weight: 600;
          color: var(--av-emerald);
          line-height: 1;
        }

        /* ---------- Members by domain ---------- */
        .members-by-category {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .category-section {
          background: var(--av-warm);
          border: 1px solid rgba(146, 121, 27, 0.3);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 16px 40px rgba(28, 28, 28, 0.35);
        }

        .category-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 20px;
          padding-bottom: 16px;
          font-family: var(--font-heading), serif;
          font-size: 26px;
          font-weight: 600;
          color: var(--av-bronze);
          border-bottom: 1px solid rgba(201, 168, 76, 0.35);
        }

        .category-count {
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
          color: var(--av-olive);
        }

        @media (prefers-reduced-motion: reduce) {
          .members-content,
          .section {
            animation: none;
          }

          .tab-button,
          .domain-card {
            transition: none;
          }

          .tab-button:hover,
          .domain-card:hover {
            transform: none;
          }
        }

        @media (max-width: 768px) {
          .members-container {
            padding: 32px 16px 48px;
          }

          .members-header {
            padding: 32px 20px 24px;
          }

          .members-header h1 {
            font-size: 32px;
          }

          .members-tagline {
            font-size: 14px;
          }

          .tabs-container {
            flex-direction: column;
          }

          .tab-button {
            width: 100%;
          }

          .domain-stats-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
