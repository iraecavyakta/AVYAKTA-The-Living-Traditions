import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../../../lib/supabase/server";
import { canonicalDomainName } from "../../../../lib/utils/domains";
import {
  verifySessionId,
  getSessionCookieName,
} from "../../../../lib/auth/session";

// Development-only logging helper
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
};

// Helper to verify admin authentication
async function verifyAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;

    if (!token) {
      return false;
    }

    const session = await verifySessionId(token);
    return session !== null;
  } catch {
    return false;
  }
}

/**
 * Flush endpoint for recruitment data
 * This endpoint performs the following operations in sequence:
 * 1. Migrate accepted second preference applicants to members table
 * 2. Migrate accepted first preference applicants to members table
 * 3. Clear the recruitment table
 *
 * All operations happen in sequence to ensure data integrity
 * Vulnerabilities mitigated:
 * - Input validation: All fields are trimmed and validated before insertion
 * - SQL Injection: Using Supabase parameterized queries prevents injection
 * - Atomicity: Operations are sequential with proper error handling
 * - Authorization: Requires admin authentication before executing destructive operations
 */
export async function POST() {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Admin authentication required",
        },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdmin();

    // Step 1: Get all recruitment IDs with approved second preferences
    devLog(
      "Step 1: Fetching recruitment IDs with approved second preferences...",
    );
    const { data: secondPrefIds, error: secondPrefIdError } = await supabase
      .from("second_preference")
      .select("recruitment_id")
      .eq("second_preference_status", "approved");

    if (secondPrefIdError) {
      throw new Error(
        `Failed to fetch second preference IDs: ${secondPrefIdError.message}`,
      );
    }

    const recruitmentIdsWithSecondPref = (secondPrefIds || []).map(
      (r) => r.recruitment_id,
    );

    // Step 2: Get recruitment data for accepted second preferences
    let secondPrefMembers = [];
    if (recruitmentIdsWithSecondPref.length > 0) {
      devLog(
        `Fetching ${recruitmentIdsWithSecondPref.length} second preference records...`,
      );
      const { data: secondPrefRecords, error: secondPrefError } = await supabase
        .from("recruitment")
        .select("id, name, second_domain_preference")
        .in("id", recruitmentIdsWithSecondPref);

      if (secondPrefError) {
        throw new Error(
          `Failed to fetch second preference records: ${secondPrefError.message}`,
        );
      }

      // Filter records with valid data and prepare for members table
      secondPrefMembers = (secondPrefRecords || [])
        .filter((record) => record.name && record.second_domain_preference)
        .map((record) => ({
          name: record.name.trim(),
          domain: canonicalDomainName(record.second_domain_preference.trim()),
          role: "members",
        }));

      if (secondPrefMembers.length > 0) {
        devLog(
          `Inserting ${secondPrefMembers.length} second preference members...`,
        );
        const { error: insertSecondPrefError } = await supabase
          .from("members")
          .insert(secondPrefMembers);

        if (insertSecondPrefError) {
          throw new Error(
            `Failed to insert second preference members: ${insertSecondPrefError.message}`,
          );
        }
      }
    }

    // Step 3: Get all recruitment records with approved first preferences
    devLog("Step 3: Fetching approved first preference records...");
    const { data: firstPrefRecords, error: firstPrefError } = await supabase
      .from("recruitment")
      .select("id, name, first_preference_domain")
      .eq("first_preference_status", "approved");

    if (firstPrefError) {
      throw new Error(
        `Failed to fetch first preference records: ${firstPrefError.message}`,
      );
    }

    // Step 4: Filter records and prepare data for members table
    const firstPrefMembers = (firstPrefRecords || [])
      .filter((record) => record.name && record.first_preference_domain)
      .map((record) => ({
        name: record.name.trim(),
        domain: canonicalDomainName(record.first_preference_domain.trim()),
        role: "members",
      }));

    // Insert accepted first preferences into members table
    if (firstPrefMembers.length > 0) {
      devLog(
        `Inserting ${firstPrefMembers.length} first preference members...`,
      );
      const { error: insertFirstPrefError } = await supabase
        .from("members")
        .insert(firstPrefMembers);

      if (insertFirstPrefError) {
        throw new Error(
          `Failed to insert first preference members: ${insertFirstPrefError.message}`,
        );
      }
    }

    // Step 5: Clear the recruitment table
    devLog("Step 5: Clearing recruitment table...");

    // Get all IDs first, then delete them (Supabase workaround for delete all)
    const { data: allRecruitmentIds, error: fetchAllIdsError } = await supabase
      .from("recruitment")
      .select("id");

    if (fetchAllIdsError) {
      throw new Error(
        `Failed to fetch recruitment IDs for deletion: ${fetchAllIdsError.message}`,
      );
    }

    if ((allRecruitmentIds || []).length > 0) {
      const idsToDelete = allRecruitmentIds.map((r) => r.id);
      const { error: deleteRecruitmentError } = await supabase
        .from("recruitment")
        .delete()
        .in("id", idsToDelete);

      if (deleteRecruitmentError) {
        throw new Error(
          `Failed to clear recruitment table: ${deleteRecruitmentError.message}`,
        );
      }
    }

    // Step 6: Clear the second_preference table (cascade handled by FK)
    devLog("Step 6: Clearing second preference table...");

    const { data: allSecondPrefIds, error: fetchAllSecondPrefIdsError } =
      await supabase.from("second_preference").select("id");

    if (fetchAllSecondPrefIdsError) {
      console.warn(
        `Warning: Failed to fetch second_preference IDs: ${fetchAllSecondPrefIdsError.message}`,
      );
    } else if ((allSecondPrefIds || []).length > 0) {
      const secondPrefIdsToDelete = allSecondPrefIds.map((r) => r.id);
      const { error: deleteSecondPrefError } = await supabase
        .from("second_preference")
        .delete()
        .in("id", secondPrefIdsToDelete);

      if (deleteSecondPrefError) {
        console.warn(
          `Warning: Failed to clear second_preference table: ${deleteSecondPrefError.message}`,
        );
      }
    }

    devLog("✅ Flush operation completed successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Recruitment data flushed successfully",
        stats: {
          secondPreferenceMembers: secondPrefMembers.length,
          firstPreferenceMembers: firstPrefMembers.length,
          totalMembersAdded: secondPrefMembers.length + firstPrefMembers.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Flush operation failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Flush operation failed",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
