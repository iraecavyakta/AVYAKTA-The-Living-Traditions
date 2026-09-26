import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// Backed by the `recruitment_config` table (a single row, id=true) instead
// of a local JSON file — a file on disk doesn't survive on serverless
// deployments (read-only/ephemeral FS, and each instance has its own copy),
// which is why toggling it previously didn't reliably take effect.

export async function getRecruitmentStatus(): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("recruitment_config")
      .select("is_open")
      .eq("id", true)
      .maybeSingle();

    if (error || !data) {
      // Missing row/unreachable DB - default to open so the site behaves
      // normally until an admin explicitly closes recruitment.
      return true;
    }

    return Boolean(data.is_open);
  } catch {
    return true;
  }
}

export async function setRecruitmentStatus(isOpen: boolean): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("recruitment_config")
    .upsert([{ id: true, is_open: isOpen }], { onConflict: "id" });

  if (error) {
    throw new Error(`Failed to update recruitment status: ${error.message}`);
  }
}
