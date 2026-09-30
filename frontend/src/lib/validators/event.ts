import { z } from "zod";

const MAX_IMAGE_CHARS = 2_000_000;
const MAX_IMAGE_LIST_CHARS = 20_000_000;

// Matches the snake_case payload shape accepted by /api/events and
// /api/events/[id] (distinct from adminEventSchema, which is a differently
// shaped camelCase schema used by the separate admin events panel).
export const eventWriteSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  highlights: z.string().trim().max(2048).optional().or(z.literal("")),
  // Admin uploads arrive as base64 data URLs (compressImage caps each image
  // at ~300 KB, roughly 400k characters), so limits are sized for that.
  image_url: z
    .string()
    .trim()
    .max(MAX_IMAGE_CHARS)
    .optional()
    .or(z.literal("")),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  venue: z.string().trim().max(200).optional().or(z.literal("")),
  registration_enabled: z.boolean().optional(),
  registration_status: z.boolean().optional(),
  // Date input sends YYYY-MM-DD; edits may echo back a stored timestamp.
  registration_deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, "Deadline must be a date")
    .nullable()
    .optional()
    .or(z.literal("")),
  payment_image_required: z.boolean().optional(),
  more_description: z.string().trim().max(4000).optional().or(z.literal("")),
  // Pipe-separated lists of base64 images.
  slug_image_url: z
    .string()
    .trim()
    .max(MAX_IMAGE_LIST_CHARS)
    .optional()
    .or(z.literal("")),
  poster_image_urls: z
    .string()
    .trim()
    .max(MAX_IMAGE_LIST_CHARS)
    .optional()
    .or(z.literal("")),
});

export const eventUpdateSchema = eventWriteSchema.partial();
