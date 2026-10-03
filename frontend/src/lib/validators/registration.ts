import { z } from "zod";

export const REGISTRATION_BRANCHES = [
  "CSE",
  "ECE",
  "EEE",
  "MECH",
  "BBA",
  "BCom",
  "BDes",
  "Architecture",
  "Pharmacy",
  "Law",
  "Other",
] as const;

export const EVENT_DOMAINS = [
  "Logistics",
  "Decor & Design",
  "Technical (Audio/Visual)",
  "Hospitality",
  "Marketing & PR",
  "Photography & Videography",
  "Artist Management",
  "Content Writing",
] as const;

export const registrationSchema = z
  .object({
    isVolunteer: z.boolean(),
    eventSelector: z.string().min(1, { message: "Please select an event." }),

    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be under 100 characters"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .max(255, "Email is too long"),
    branch: z.string().min(1, "Please select your branch"),
    classYear: z
      .number()
      .min(1, "Current year must be between 1 and 5")
      .max(5, "Current year must be between 1 and 5"),
    section: z.string().min(1, "Section is required").max(10),
    srn: z
      .string()
      .length(13, "SRN must be exactly 13 characters")
      .regex(
        /^PES[12][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/i,
        "SRN format: PES + 1 or 2 + 2 letters + 2 numbers + 2 letters + 3 numbers (e.g., PES2UG23CS135)",
      ),
    phone_number: z
      .string()
      .regex(/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"),
    hostel: z.boolean(),

    // Participant-only fields
    dietaryNeeds: z.string().max(200).optional(),
    teamName: z.string().max(100).optional(),

    // Volunteer-only fields
    volunteerDomain: z.string().optional(),
    volunteerExperience: z.string().max(1024).optional(),

    links: z.string().optional(),

    payment_image_url: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isVolunteer) {
      if (!data.volunteerDomain) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["volunteerDomain"],
          message: "Please select a volunteer domain",
        });
      }
    }
  });

export type RegistrationFormData = z.infer<typeof registrationSchema>;
