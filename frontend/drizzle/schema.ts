import {
  pgTable,
  uuid,
  text,
  date,
  boolean,
  integer,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  domain: text("domain").default("General").notNull(),
  highlights: text("highlights"),
  timeline: text("timeline"),
  image_url: text("image_url"),
  date: date("date"),
  venue: text("venue"),
  registration_status: boolean("registration_status").default(true),
  registration_deadline: date("registration_deadline"),
  payment_image_required: boolean("payment_image_required").default(false),
});

export const event_slug = pgTable("event_slug", {
  id: uuid("id").primaryKey().defaultRandom(),
  event_id: uuid("event_id")
    .notNull()
    .references(() => events.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  title: text("title").notNull(),
  more_description: text("more_description"),
  image_url: text("image_url"), // comma-separated URLs
});

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // One of the club's domains. Empty string for the Club Head, who belongs to
  // the club rather than a domain (the column is NOT NULL).
  domain: text("domain").notNull(),
  // "domain_head" | "members" | "club_head"
  role: text("role").notNull(),
  photo_url: text("photo_url"),
  // Team tags: "current" | "previous" | "founder" | "faculty" | "poc" | "club_head".
  // faculty -> Faculty tab, current -> Current Team, anything else -> past teams.
  tags: text("tags").array().notNull().default([]),
  // Team year, used for "previous" members.
  year: integer("year"),
});

export const posters = pgTable("posters", {
  id: uuid("id").primaryKey().defaultRandom(),
  event_id: uuid("event_id")
    .notNull()
    .references(() => events.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  title: text("title").notNull(),
  poster_image_url: text("poster_image_url").notNull(),
});

export const recruitment = pgTable("recruitment", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  first_preference_domain: text("first_preference_domain").notNull(),
  srn: text("srn").notNull(),
  year: integer("year").notNull(),
  branch: text("branch").notNull(),
  section: text("section").notNull(),
  links: text("links"),
  experience: text("experience"),
  why_you: text("why_you").notNull(),
  why_us: text("why_us").notNull(),
  phone_no: text("phone_no").notNull(),
  email: text("email").notNull(),
  interview: boolean("interview").default(false),
  first_preference_status: text("first_preference_status").default("pending"),
  second_domain_preference: text("second_domain_preference"),
});

export const registration = pgTable("registration", {
  id: uuid("id").primaryKey().defaultRandom(),
  event_id: uuid("event_id")
    .notNull()
    .references(() => events.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  name: text("name").notNull(),
  srn: text("srn").notNull(),
  branch: text("branch").notNull(),
  hostel: boolean("hostel").default(false),
  email: text("email").notNull(),
  phone_no: text("phone_no").notNull(),
  payment_image_url: text("payment_image_url"),
  is_volunteer: boolean("is_volunteer").notNull().default(false),
  class_year: integer("class_year"),
  section: text("section"),
  dietary_needs: text("dietary_needs"),
  team_name: text("team_name"),
  volunteer_domain: text("volunteer_domain"),
  volunteer_experience: text("volunteer_experience"),
  links: text("links"),
});

export const login_credentials = pgTable("login_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  password_hash: text("password_hash").notNull(),
  // null = full admin; otherwise exactly one of the club's domain names
  // (enforced by the login_credentials_domain_valid CHECK constraint).
  domain: text("domain"),
});

export const second_preference = pgTable("second_preference", {
  id: uuid("id").primaryKey().defaultRandom(),
  recruitment_id: uuid("recruitment_id")
    .notNull()
    .references(() => recruitment.id, {
      onDelete: "cascade",
    }),
  interview: boolean("interview").default(false),
  second_preference_status: text("second_preference_status").default("pending"),
});

export const counter = pgTable("counter", {
  domain: text("domain").primaryKey(),
  not_sure: integer("not_sure").default(0),
  approved: integer("approved").default(0),
  rejected: integer("rejected").default(0),
});

export const indicator = pgTable("indicator", {
  id: uuid("id").primaryKey().defaultRandom(),
  domain: text("domain").notNull().unique(),
  indicator: boolean("indicator").default(false),
});

export const recruitment_config = pgTable("recruitment_config", {
  id: boolean("id").primaryKey().default(true),
  is_open: boolean("is_open").notNull().default(true),
  // Legacy single group link; superseded by recruitment_domain_links and no
  // longer read by the app. Safe to drop.
  whatsapp_url: text("whatsapp_url"),
});

// WhatsApp group links shown to a candidate on the thank-you page, one row per
// domain: the first-preference link and the second-preference link. Admin-only
// (RLS on, no policies); read and written with the service-role key.
export const recruitment_domain_links = pgTable("recruitment_domain_links", {
  domain: text("domain").primaryKey(),
  first_pref_url: text("first_pref_url"),
  second_pref_url: text("second_pref_url"),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Private reviewer notes, one per candidate per domain, so a second-preference
// head never sees the first-preference head's note. Deleted when that domain
// accepts or rejects the candidate. Admin/domain-head only (RLS on, no policies).
export const recruitment_feedback = pgTable(
  "recruitment_feedback",
  {
    recruitment_id: uuid("recruitment_id")
      .notNull()
      .references(() => recruitment.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    feedback: text("feedback").notNull().default(""),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.recruitment_id, table.domain] })],
);
