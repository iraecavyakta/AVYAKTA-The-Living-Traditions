import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyAdminAuth } from "@/lib/auth/session";

// Admin-only: stores one event image in Supabase Storage and returns its
// public URL. The event save then carries just that short URL instead of the
// whole picture, which is what used to break large uploads.
// ponytail: images removed from an event stay in the bucket (orphaned). Add a
// cleanup job if storage ever matters.

const BUCKETS = {
  cover: "events",
  detail: "event_slug",
  poster: "poster",
} as const;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// The form compresses to ~300 KB before uploading; this is just a safety cap.
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }
  if (!(kind in BUCKETS)) {
    return NextResponse.json({ error: "Unknown image type" }, { status: 400 });
  }
  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WebP or GIF images are allowed" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large (max 5 MB after compression)" },
      { status: 400 },
    );
  }

  const bucket = BUCKETS[kind as keyof typeof BUCKETS];
  // Our own name: never trust the uploaded filename.
  const path = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${extension}`;
  const storage = getSupabaseAdmin().storage.from(bucket);

  const { error } = await storage.upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000", // names are unique, so browsers can cache for a year
  });
  if (error) {
    console.error(`Event image upload to "${bucket}" failed:`, error);
    return NextResponse.json(
      { error: "Couldn't store the image. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: storage.getPublicUrl(path).data.publicUrl });
}
