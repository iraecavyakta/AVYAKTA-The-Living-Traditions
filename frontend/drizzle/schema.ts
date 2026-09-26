import {
  pgTable,
  uuid,
  text,
  date,
  boolean,
  integer,
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
  domain: text("domain").notNull(),
  role: text("role").notNull(),
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
  is_volunteer: boolean("is_volunteer").default(false),
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
  domain: text("domain"), // null = full admin; otherwise the domain this login manages
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
