import { z } from "zod";

export const RECRUITMENT_DOMAINS = [
  "Design",
  "Event Management",
  "Finance and Ethics",
  "Logistics",
  "Marketing",
  "Media and Visibility",
  "Operations",
  "Technical",
] as const;

export const RECRUITMENT_BRANCHES = [
  "CSE",
  "AIML",
  "ECE",
  "Pharm.D.",
  "B.Pharm.",
  "MBA",
  "BBA",
  "MBBS",
  "Nursing",
  "AHS",
  "BPT",
  "FOMC",
] as const;

export const recruitmentSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(1024, "Name must not exceed 1024 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    email: z.string().email("Invalid email address"),
    phone_number: z
      .string()
      .length(10, "Phone number must be exactly 10 digits")
      .regex(/^\d{10}$/, "Phone number must contain only digits"),
    first_preference_domain: z.enum(RECRUITMENT_DOMAINS, {
      message: "Please select a valid domain",
    }),
    srn: z
      .string()
      .length(13, "SRN must be exactly 13 characters")
      .regex(
        /^PES2[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/,
        "SRN format: PES2 + 2 letters + 2 numbers + 2 letters + 3 numbers (e.g., PES2UG23CS135)",
      ),
    year: z
      .number()
      .int("Current year must be an integer")
      .min(1, "Current year must be greater than 0"),
    branch: z.enum(RECRUITMENT_BRANCHES, {
      message: "Please select a valid branch",
    }),
    section: z
      .string()
      .min(1, "Section is required")
      .max(1024, "Section must not exceed 1024 characters"),
    links: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true; // optional field
        try {
          const parsed = JSON.parse(val);
          if (!Array.isArray(parsed)) return false;
          if (parsed.length > 10) return false; // max 10 links
          return parsed.every(
            (link) =>
              typeof link === "string" &&
              link.trim().length > 0 &&
              link.length <= 1024,
          );
        } catch {
          return false;
        }
      }, "Links must be a valid JSON array of strings (max 10 links, each max 1024 characters)"),
    experience: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.length <= 1024,
        "Experience must not exceed 1024 characters",
      ),
    why_you: z
      .string()
      .min(10, "Please provide at least 10 characters")
      .max(1024, "Must not exceed 1024 characters"),
    why_us: z
      .string()
      .min(10, "Please provide at least 10 characters")
      .max(1024, "Must not exceed 1024 characters"),
    second_domain_preference: z.enum(RECRUITMENT_DOMAINS).optional(),
  })
  .refine(
    (data) => {
      if (data.first_preference_domain && data.second_domain_preference) {
        return data.first_preference_domain !== data.second_domain_preference;
      }
      return true;
    },
    {
      message: "Second domain preference must be different from primary domain",
      path: ["second_domain_preference"],
    },
  );

export type RecruitmentFormData = z.infer<typeof recruitmentSchema>;
