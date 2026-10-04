import { NextRequest, NextResponse } from "next/server";
import { requireDomainAccess } from "@/lib/auth/domainAccess";
import { sendMailAfterResponse } from "@/lib/mail/send";
import { decisionEmail } from "@/lib/mail/templates";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { formatDomainFromUrl } from "@/lib/utils/domainFormatter";
import { isValidDomain } from "@/lib/utils/domainValidator";

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

const isFinalStatus = (status: string | null | undefined) => {
  const normalizedStatus = normalizeStatus(status);
  return normalizedStatus === "approved" || normalizedStatus === "rejected";
};

const getCounterStatus = (
  firstPreferenceStatus: string | null | undefined,
  secondPreferenceStatus: string | null | undefined,
) => {
  const normalizedSecondStatus = normalizeStatus(secondPreferenceStatus);
  if (isFinalStatus(normalizedSecondStatus)) {
    return normalizedSecondStatus;
  }

  const normalizedFirstStatus = normalizeStatus(firstPreferenceStatus);
  if (isFinalStatus(normalizedFirstStatus)) {
    return normalizedFirstStatus;
  }

  return "pending";
};

const INTERVIEW_REQUIRED_ERROR =
  "Mark the interview as completed before accepting or rejecting";

// Reviewer notes are scratch space for deciding; once this domain has made its
// final call on the candidate they are deleted. Other domains' notes stay.
const flushFeedback = async (
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  recruitmentId: string,
  domainSlug: string,
) => {
  const { error } = await supabaseAdmin
    .from("recruitment_feedback")
    .delete()
    .eq("recruitment_id", recruitmentId)
    .eq("domain", formatDomainFromUrl(domainSlug));
  if (error) console.error("Failed to flush feedback:", error.message);
};

const applyCounterTransition = async (
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  domain: string,
  previousStatus: string,
  nextStatus: string,
) => {
  if (previousStatus === nextStatus) {
    return;
  }

  const { data: currentCounter, error: counterFetchError } = await supabaseAdmin
    .from("counter")
    .select("domain, not_sure, approved, rejected")
    .eq("domain", domain)
    .maybeSingle();

  if (counterFetchError) {
    throw new Error(
      `Failed to load counter for ${domain}: ${counterFetchError.message}`,
    );
  }

  if (!currentCounter) {
    const { error: insertError } = await supabaseAdmin
      .from("counter")
      .insert([{ domain, not_sure: 0, approved: 0, rejected: 0 }]);

    if (insertError) {
      throw new Error(
        `Failed to initialize counter for ${domain}: ${insertError.message}`,
      );
    }

    return applyCounterTransition(
      supabaseAdmin,
      domain,
      previousStatus,
      nextStatus,
    );
  }

  const nextCounter = {
    not_sure: currentCounter.not_sure ?? 0,
    approved: currentCounter.approved ?? 0,
    rejected: currentCounter.rejected ?? 0,
  };

  if (previousStatus === "pending") {
    nextCounter.not_sure = Math.max(nextCounter.not_sure - 1, 0);
  } else if (previousStatus === "approved") {
    nextCounter.approved = Math.max(nextCounter.approved - 1, 0);
  } else if (previousStatus === "rejected") {
    nextCounter.rejected = Math.max(nextCounter.rejected - 1, 0);
  }

  if (nextStatus === "pending") {
    nextCounter.not_sure += 1;
  } else if (nextStatus === "approved") {
    nextCounter.approved += 1;
  } else if (nextStatus === "rejected") {
    nextCounter.rejected += 1;
  }

  const { error: counterUpdateError } = await supabaseAdmin
    .from("counter")
    .update(nextCounter)
    .eq("domain", domain);

  if (counterUpdateError) {
    throw new Error(
      `Failed to update counter for ${domain}: ${counterUpdateError.message}`,
    );
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string; id: string }> },
) {
  try {
    const { domain, id } = await params;

    if (!isValidDomain(domain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 404 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Invalid recruit ID" },
        { status: 400 },
      );
    }

    const denied = await requireDomainAccess(domain);
    if (denied) return denied;

    const displayDomain = formatDomainFromUrl(domain);
    const supabaseAdmin = getSupabaseAdmin();

    const { data: recruit, error: recruitError } = await supabaseAdmin
      .from("recruitment")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (recruitError || !recruit) {
      return NextResponse.json({ error: "Recruit not found" }, { status: 404 });
    }

    const isFirstPreference = recruit.first_preference_domain === displayDomain;
    const isSecondPreference =
      recruit.second_domain_preference === displayDomain;

    if (!isFirstPreference && !isSecondPreference) {
      return NextResponse.json(
        { error: "Recruit not found in this domain" },
        { status: 404 },
      );
    }

    let secondPreference: SecondPreferenceRow | null = null;

    if (isSecondPreference) {
      const { data: secondPrefData } = await supabaseAdmin
        .from("second_preference")
        .select("id, recruitment_id, interview, second_preference_status")
        .eq("recruitment_id", id)
        .maybeSingle();

      secondPreference = secondPrefData ?? null;
    }

    return NextResponse.json(
      { recruit: recruit as RecruitRow, secondPreference },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in get recruit endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string; id: string }> },
) {
  try {
    const { domain, id } = await params;

    if (!isValidDomain(domain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 404 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Invalid recruit ID" },
        { status: 400 },
      );
    }

    const denied = await requireDomainAccess(domain);
    if (denied) return denied;

    const body = await request.json();
    const supabaseAdmin = getSupabaseAdmin();
    const isSecondPreference = Boolean(body.isSecondPreference);
    const interview =
      typeof body.interview === "boolean" ? body.interview : undefined;
    const status = normalizeStatus(
      typeof body.status === "string" ? body.status : undefined,
    );

    const { data: recruit, error: recruitError } = await supabaseAdmin
      .from("recruitment")
      .select(
        "id, name, email, first_preference_domain, first_preference_status, second_domain_preference, interview",
      )
      .eq("id", id)
      .maybeSingle();

    if (recruitError || !recruit) {
      return NextResponse.json({ error: "Recruit not found" }, { status: 404 });
    }

    if (isSecondPreference && recruit.first_preference_status !== "rejected") {
      return NextResponse.json(
        {
          error:
            "Second preference can only be updated after first preference rejection",
        },
        { status: 409 },
      );
    }

    if (isSecondPreference) {
      const { data: existingSecondPreference, error: fetchError } =
        await supabaseAdmin
          .from("second_preference")
          .select("id, second_preference_status, interview")
          .eq("recruitment_id", id)
          .maybeSingle();

      if (fetchError) {
        return NextResponse.json(
          { error: "Failed to update second preference" },
          { status: 500 },
        );
      }

      const currentSecondStatus = normalizeStatus(
        existingSecondPreference?.second_preference_status,
      );
      if (
        currentSecondStatus === "approved" ||
        currentSecondStatus === "rejected"
      ) {
        return NextResponse.json(
          { error: "Second preference is already finalized" },
          { status: 409 },
        );
      }

      if (
        isFinalStatus(status) &&
        !(interview ?? existingSecondPreference?.interview)
      ) {
        return NextResponse.json(
          { error: INTERVIEW_REQUIRED_ERROR },
          { status: 400 },
        );
      }

      if (existingSecondPreference) {
        const previousCounterStatus = getCounterStatus(
          recruit.first_preference_status,
          existingSecondPreference.second_preference_status,
        );
        const nextCounterStatus = getCounterStatus(
          recruit.first_preference_status,
          status,
        );

        const { error: updateError } = await supabaseAdmin
          .from("second_preference")
          .update({
            ...(typeof interview === "boolean" ? { interview } : {}),
            ...(status ? { second_preference_status: status } : {}),
          })
          .eq("recruitment_id", id);

        if (updateError) {
          return NextResponse.json(
            { error: "Failed to update second preference" },
            { status: 500 },
          );
        }

        if (previousCounterStatus !== nextCounterStatus) {
          await applyCounterTransition(
            supabaseAdmin,
            formatDomainFromUrl(domain),
            previousCounterStatus,
            nextCounterStatus,
          );
        }
      } else {
        const previousCounterStatus = getCounterStatus(
          recruit.first_preference_status,
          null,
        );
        const nextCounterStatus = getCounterStatus(
          recruit.first_preference_status,
          status,
        );

        const { error: insertError } = await supabaseAdmin
          .from("second_preference")
          .insert([
            {
              recruitment_id: id,
              interview: typeof interview === "boolean" ? interview : false,
              second_preference_status: status,
            },
          ]);

        if (insertError) {
          return NextResponse.json(
            { error: "Failed to update second preference" },
            { status: 500 },
          );
        }

        if (previousCounterStatus !== nextCounterStatus) {
          await applyCounterTransition(
            supabaseAdmin,
            formatDomainFromUrl(domain),
            previousCounterStatus,
            nextCounterStatus,
          );
        }
      }
    } else {
      const currentFirstStatus = normalizeStatus(
        recruit.first_preference_status,
      );
      if (isFinalStatus(currentFirstStatus)) {
        return NextResponse.json(
          { error: "First preference is already finalized" },
          { status: 409 },
        );
      }

      if (isFinalStatus(status) && !(interview ?? recruit.interview)) {
        return NextResponse.json(
          { error: INTERVIEW_REQUIRED_ERROR },
          { status: 400 },
        );
      }

      const nextCounterStatus = getCounterStatus(status, null);

      const { error: updateError } = await supabaseAdmin
        .from("recruitment")
        .update({
          ...(typeof interview === "boolean" ? { interview } : {}),
          ...(status ? { first_preference_status: status } : {}),
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update recruit" },
          { status: 500 },
        );
      }

      await applyCounterTransition(
        supabaseAdmin,
        formatDomainFromUrl(domain),
        getCounterStatus(currentFirstStatus, null),
        nextCounterStatus,
      );

      if (status === "rejected" && recruit.second_domain_preference) {
        const { data: existingSecondPreference } = await supabaseAdmin
          .from("second_preference")
          .select("id, second_preference_status")
          .eq("recruitment_id", id)
          .maybeSingle();

        if (!existingSecondPreference) {
          const { error: insertSecondPreferenceError } = await supabaseAdmin
            .from("second_preference")
            .insert([
              {
                recruitment_id: id,
                interview: false,
                second_preference_status: "pending",
              },
            ]);

          if (insertSecondPreferenceError) {
            return NextResponse.json(
              { error: "Failed to create second preference" },
              { status: 500 },
            );
          }
        } else if (
          !isFinalStatus(existingSecondPreference.second_preference_status)
        ) {
          const { error: updateSecondPreferenceError } = await supabaseAdmin
            .from("second_preference")
            .update({
              second_preference_status: "pending",
            })
            .eq("recruitment_id", id);

          if (updateSecondPreferenceError) {
            return NextResponse.json(
              { error: "Failed to initialize second preference" },
              { status: 500 },
            );
          }
        }
      }
    }

    if (isFinalStatus(status)) {
      await flushFeedback(supabaseAdmin, id, domain);

      // Emails 2/3 (first preference) and 3/3 (second preference).
      sendMailAfterResponse({
        to: recruit.email,
        ...decisionEmail({
          name: recruit.name,
          preference: isSecondPreference ? "second" : "first",
          domain: isSecondPreference
            ? (recruit.second_domain_preference ?? "")
            : recruit.first_preference_domain,
          accepted: status === "approved",
          nextDomain: isSecondPreference
            ? null
            : recruit.second_domain_preference,
          firstDomain: recruit.first_preference_domain,
        }),
      });
    }

    return NextResponse.json(
      { message: "Recruit updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in update recruit endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
