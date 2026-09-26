import { z } from "zod";

// Matches the snake_case payload shape accepted by /api/events and
// /api/events/[id] (distinct from adminEventSchema, which is a differently
// shaped camelCase schema used by the separate admin events panel).
export const eventWriteSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  image_url: z.string().trim().url().max(1024).optional().or(z.literal("")),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  venue: z.string().trim().max(200).optional().or(z.literal("")),
  registration_enabled: z.boolean().optional(),
  registration_status: z.boolean().optional(),
  payment_image_required: z.boolean().optional(),
  more_description: z.string().trim().max(4000).optional().or(z.literal("")),
  slug_image_url: z.string().trim().max(4096).optional().or(z.literal("")),
  poster_image_urls: z.string().trim().max(8192).optional().or(z.literal("")),
});

export const eventUpdateSchema = eventWriteSchema.partial();
