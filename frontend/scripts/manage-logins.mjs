#!/usr/bin/env node
/**
 * Manage rows in the `login_credentials` table — the only way accounts get
 * created, since there is no self-service signup by design (club heads are
 * assigned a login manually, not invited to pick their own).
 *
 * Usage:
 *   node scripts/manage-logins.mjs create --email head@x.com --password "secret123" [--domain "Technical"]
 *   node scripts/manage-logins.mjs list
 *   node scripts/manage-logins.mjs delete --email head@x.com
 *
 * Omit --domain (or pass --domain admin) to create the full-admin account.
 * `create` upserts by email, so re-running it for an existing email rotates
 * that account's password — that's the intended way to revoke/replace a
 * leaked or outdated password too.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from
 * frontend/.env.local — run this from the frontend/ directory.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const RECRUITMENT_DOMAINS = [
  "Technical",
  "Design",
  "Event Management",
  "Ethics and Discipline",
  "Media and Visibility",
  "Logistics and Operations",
  "Marketing",
  "Finance",
];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value =
        argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      args[key] = value;
    }
  }
  return args;
}

function fail(message) {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    fail(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local",
    );
  }
  return createClient(url, serviceRoleKey);
}

async function createLogin(args) {
  const email = args.email?.trim().toLowerCase();
  const password = args.password;
  const domainArg = args.domain === true ? undefined : args.domain;

  if (!email || !email.includes("@")) fail("Pass a valid --email");
  if (!password || password.length < 6)
    fail("Pass a --password of at least 6 characters");

  let domain = null;
  if (domainArg && domainArg.toLowerCase() !== "admin") {
    const match = RECRUITMENT_DOMAINS.find(
      (d) => d.toLowerCase() === domainArg.toLowerCase(),
    );
    if (!match) {
      fail(
        `"${domainArg}" is not a known domain. Valid values: ${RECRUITMENT_DOMAINS.join(", ")}, or "admin"/omit for the admin account.`,
      );
    }
    domain = match;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("login_credentials")
    .upsert([{ email, password_hash, domain }], { onConflict: "email" })
    .select("id, email, domain");

  if (error) fail(error.message);

  const row = data[0];
  console.log(
    `\nOK: ${row.email} -> ${row.domain ?? "admin"} (id: ${row.id})\n`,
  );
}

async function listLogins() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("login_credentials")
    .select("id, email, domain")
    .order("domain", { ascending: true, nullsFirst: true });

  if (error) fail(error.message);

  if (!data.length) {
    console.log("\nNo login_credentials rows yet.\n");
    return;
  }

  console.log("");
  for (const row of data) {
    console.log(`  ${(row.domain ?? "admin").padEnd(28)} ${row.email}`);
  }
  console.log("");
}

async function deleteLogin(args) {
  const email = args.email?.trim().toLowerCase();
  if (!email) fail("Pass --email of the account to remove");

  const supabase = getSupabase();
  const { error, count } = await supabase
    .from("login_credentials")
    .delete({ count: "exact" })
    .eq("email", email);

  if (error) fail(error.message);
  console.log(`\nOK: removed ${count ?? 0} row(s) for ${email}\n`);
}

const [, , command, ...rest] = process.argv;
const args = parseArgs(rest);

switch (command) {
  case "create":
    await createLogin(args);
    break;
  case "list":
    await listLogins();
    break;
  case "delete":
    await deleteLogin(args);
    break;
  default:
    console.log(`
Usage:
  node scripts/manage-logins.mjs create --email head@x.com --password "secret123" [--domain "Technical"]
  node scripts/manage-logins.mjs list
  node scripts/manage-logins.mjs delete --email head@x.com
`);
    process.exit(command ? 1 : 0);
}
