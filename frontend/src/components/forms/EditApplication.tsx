"use client";

import { useEffect, useState } from "react";
import RecruitmentForm from "./RecruitmentForm";
import type { RecruitmentFormData } from "../../lib/validators/recruitment";

type Stage = "received" | "interviewed" | "second_preference" | "decided";

type Loaded = {
  application: Omit<
    RecruitmentFormData,
    "links" | "second_domain_preference"
  > & {
    second_domain_preference: string | null;
    links: string[];
  };
  editable: boolean;
  stage: Stage;
};

const card = {
  background: "rgba(252, 248, 240, 0.94)",
  border: "1px solid rgba(146, 121, 27, 0.35)",
  borderRadius: 16,
  padding: "1.75rem",
  marginBottom: "1.5rem",
  boxShadow: "0 12px 32px rgba(28, 28, 28, 0.25)",
  fontFamily: "Inter, sans-serif",
  color: "#3a3a3a",
} as const;

// Steps done for each stage. A decision is never named here, only that one was
// made - the candidate learns the outcome from the email.
const DONE: Record<Stage, number> = {
  received: 1,
  interviewed: 2,
  second_preference: 2,
  decided: 3,
};

function Tracker({ stage }: { stage: Stage }) {
  const steps = [
    "Application received",
    stage === "second_preference" ? "Second-preference round" : "Interview",
    "Decision emailed",
  ];
  const done = DONE[stage];

  return (
    <ol
      style={{
        display: "flex",
        gap: "0.75rem",
        listStyle: "none",
        margin: "0 0 1.25rem",
        padding: 0,
        flexWrap: "wrap",
      }}
    >
      {steps.map((label, i) => {
        const isDone = i < done;
        const isCurrent = i === done;
        return (
          <li
            key={label}
            style={{
              flex: "1 1 150px",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              opacity: isDone || isCurrent ? 1 : 0.5,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: 13,
                fontWeight: 700,
                background: isDone ? "#92791B" : "transparent",
                color: isDone ? "#fff" : "#92791B",
                border: "2px solid #92791B",
              }}
            >
              {isDone ? "✓" : i + 1}
            </span>
            <span style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 500 }}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function EditApplication({
  token,
  bgImage,
}: {
  token: string;
  bgImage?: string;
}) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/recruitment/application", {
      headers: { "x-edit-token": token },
      cache: "no-store",
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Something went wrong.");
        setData(body);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong."),
      );
  }, [token]);

  if (error) {
    return (
      <div style={card}>
        <strong>{error}</strong>
        <p style={{ margin: "0.75rem 0 0" }}>
          Please use the link from your confirmation email. If you can&apos;t
          find it, submit the recruitment form again with your SRN and
          we&apos;ll email you a fresh link.
        </p>
      </div>
    );
  }

  if (!data) return <div style={card}>Loading your application...</div>;

  const { application, editable, stage } = data;

  return (
    <>
      <div style={card}>
        <p style={{ margin: "0 0 1rem", fontWeight: 700 }}>
          Hi {application.name}, here&apos;s where your application stands.
        </p>
        <Tracker stage={stage} />
        <p style={{ margin: 0, fontSize: 14 }}>
          <strong>First preference:</strong>{" "}
          {application.first_preference_domain}
          {application.second_domain_preference && (
            <>
              {" "}
              &middot; <strong>Second preference:</strong>{" "}
              {application.second_domain_preference}
            </>
          )}
        </p>
      </div>

      {editable ? (
        <RecruitmentForm
          bgImage={bgImage}
          editing={{
            token,
            initial: {
              ...application,
              second_domain_preference:
                (application.second_domain_preference as RecruitmentFormData["second_domain_preference"]) ??
                undefined,
              links: undefined,
            },
            links: application.links,
          }}
        />
      ) : (
        <div style={card}>
          <strong>Editing is closed.</strong>
          <p style={{ margin: "0.5rem 0 0" }}>
            Your application is already with the review team, so it can no
            longer be changed. We&apos;ll email you as soon as there&apos;s a
            decision.
          </p>
        </div>
      )}
    </>
  );
}
