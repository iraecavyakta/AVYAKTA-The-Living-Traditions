// Checks the club mailbox end to end without touching the database:
//   npm run test-mail -- you@example.com [received|accepted|moved|rejected]
// Verifies the SMTP login first (clear error if the app password is wrong),
// then sends one of the real recruitment emails to the address you give.
import nodemailer from "nodemailer";
import {
  applicationReceivedEmail,
  decisionEmail,
} from "../src/lib/mail/templates.ts";

const [to, kind = "received"] = process.argv.slice(2);
const {
  SMTP_HOST,
  SMTP_PORT = "465",
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env;

if (!to) {
  console.error(
    "Usage: npm run test-mail -- you@example.com [received|accepted|moved|rejected]",
  );
  process.exit(1);
}
if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.error(
    "Set SMTP_HOST, SMTP_USER and SMTP_PASS in frontend/.env.local first.",
  );
  process.exit(1);
}

const samples = {
  received: () =>
    applicationReceivedEmail({
      name: "Test Candidate",
      firstDomain: "Technical",
      secondDomain: "Design",
      editUrl: "https://example.com/recruitment/edit?token=TEST",
    }),
  accepted: () =>
    decisionEmail({
      name: "Test Candidate",
      domain: "Technical",
      accepted: true,
      preference: "first",
    }),
  moved: () =>
    decisionEmail({
      name: "Test Candidate",
      domain: "Technical",
      accepted: false,
      preference: "first",
      nextDomain: "Design",
    }),
  rejected: () =>
    decisionEmail({
      name: "Test Candidate",
      domain: "Design",
      accepted: false,
      preference: "second",
      firstDomain: "Technical",
    }),
};
if (!samples[kind]) {
  console.error(
    `Unknown kind "${kind}". Use: ${Object.keys(samples).join(", ")}`,
  );
  process.exit(1);
}

const port = Number(SMTP_PORT);
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

try {
  await transporter.verify();
  console.log(`SMTP login OK (${SMTP_USER} @ ${SMTP_HOST}:${port})`);
  const email = samples[kind]();
  const info = await transporter.sendMail({
    from: `"Avyakta" <${MAIL_FROM || SMTP_USER}>`,
    to,
    ...email,
  });
  console.log(`Sent "${email.subject}" to ${to}  (${info.response})`);
} catch (error) {
  console.error("FAILED:", error.message);
  if (error.code === "EAUTH") {
    console.error(
      "Login rejected. Use a 16-character Google *app password* (not the normal password), " +
        "and make sure the Workspace admin allows app passwords.",
    );
  }
  process.exit(1);
}
