// Recruitment emails. A candidate gets at most three:
//   1. application received      2. first-preference decision
//   3. second-preference decision (only if the first was rejected)
// All wording lives in this file - edit the copy here.

type Email = { subject: string; html: string; text: string };

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const GOLD = "#92791B";
const CHARCOAL = "#1C1C1C";
const EMERALD = "#1B5E3B";
const CRIMSON = "#8B1A1A";

/** Shared branded shell. Table + inline styles: the only thing mail clients render reliably. */
function layout(opts: {
  preheader: string;
  heading: string;
  accent: string;
  paragraphs: string[];
  badge?: string;
}): string {
  const body = opts.paragraphs
    .map((p) =>
      p.startsWith("<ol") || p.startsWith("<div")
        ? p
        : `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#3a3a3a;">${p}</p>`,
    )
    .join("");
  const badge = opts.badge
    ? `<div style="margin:0 0 20px;"><span style="display:inline-block;padding:6px 16px;border-radius:999px;background:${opts.accent};color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${opts.badge}</span></div>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${opts.heading}</title></head>
<body style="margin:0;padding:0;background:#F5F0E8;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6dcc3;">
    <tr><td style="background:${CHARCOAL};padding:28px 32px;text-align:center;border-bottom:3px solid ${GOLD};">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:6px;color:#C9A84C;text-transform:uppercase;">Avyakta</div>
      <div style="font-family:Georgia,serif;font-style:italic;font-size:13px;color:#d8cba3;margin-top:6px;">The Wholeness in Becoming</div>
    </td></tr>
    <tr><td style="padding:36px 32px 12px;font-family:Arial,Helvetica,sans-serif;">
      ${badge}
      <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.3;color:${GOLD};font-weight:600;">${opts.heading}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:8px 32px 32px;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0;font-size:16px;line-height:1.65;color:#3a3a3a;">Warm regards,<br><strong>Team Avyakta</strong></p>
    </td></tr>
    <tr><td style="background:#faf6ec;padding:18px 32px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a8470;">
      Avyakta &middot; PESU EC<br>You are receiving this because you applied through the Avyakta recruitment form.
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

/** Plain-text twin, built from the same paragraphs (HTML tags stripped). */
const toText = (paragraphs: string[], heading: string) =>
  [
    heading,
    "",
    ...paragraphs.map((p) =>
      p
        .replace(/<li[^>]*>/g, "\n- ")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"'),
    ),
    "",
    "Warm regards,",
    "Team Avyakta",
  ].join("\n");

function build(opts: {
  subject: string;
  heading: string;
  accent: string;
  badge?: string;
  paragraphs: string[];
}): Email {
  return {
    subject: opts.subject,
    html: layout({ ...opts, preheader: opts.subject }),
    text: toText(opts.paragraphs, opts.heading),
  };
}

const button = (url: string, label: string) =>
  `<div style="margin:4px 0 20px;"><a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 28px;background:${GOLD};color:#ffffff;border-radius:999px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;">${label}</a></div>`;

const linkFallback = (url: string) =>
  `<span style="font-size:13px;color:#8a8470;">Button not working? Copy this private link into your browser: ${escapeHtml(url)}</span>`;

/** 1/3 - sent right after the form is submitted. */
export function applicationReceivedEmail(p: {
  name: string;
  firstDomain: string;
  secondDomain?: string | null;
  /** Private link to edit / track the application. */
  editUrl: string;
}): Email {
  const name = escapeHtml(p.name);
  const first = escapeHtml(p.firstDomain);
  const second = p.secondDomain ? escapeHtml(p.secondDomain) : null;

  return build({
    subject: "We've received your Avyakta application",
    heading: "Thank you for applying!",
    accent: GOLD,
    badge: "Application received",
    paragraphs: [
      `Hi ${name},`,
      `Thank you for applying to Avyakta. We've received your application for the following domains:`,
      `<strong>First preference:</strong> ${first}` +
        (second ? `<br><strong>Second preference:</strong> ${second}` : ""),
      `<strong>Here's how the process works:</strong>`,
      `<ol style="margin:0 0 16px;padding-left:22px;font-size:16px;line-height:1.65;color:#3a3a3a;">` +
        `<li style="margin-bottom:10px;"><strong>First-preference interview.</strong> The <strong>${first}</strong> team will contact you in the <strong>${first}</strong> WhatsApp group to schedule an online interview. Please make sure you've joined that group — the link is shown on the confirmation page right after you submit the form.</li>` +
        `<li style="margin-bottom:10px;"><strong>Decision.</strong> Once the interviews are done, the head of ${first} reviews every candidate and records a decision. You'll receive an email as soon as it's made.</li>` +
        (second
          ? `<li style="margin-bottom:10px;"><strong>Second-preference interview.</strong> If you're not selected for ${first}, your second preference, <strong>${second}</strong>, takes over: a second online interview will be held and its details will be shared in the <strong>${second}</strong> WhatsApp group. You'll get a final email once that decision is made.</li>`
          : "") +
        `</ol>`,
      `<strong>Made a mistake, or want to add more (extra links to showcase, for example)?</strong> You can edit your application, and track where it stands, until your interview begins:`,
      button(p.editUrl, "Edit or track my application"),
      linkFallback(p.editUrl),
      `This link is private to you — please don't forward it. Nothing else is needed right now; just keep an eye on your WhatsApp group and your inbox.`,
    ],
  });
}

/** Re-sent when the same SRN applies twice, instead of a second application. */
export function editLinkEmail(p: { name: string; editUrl: string }): Email {
  return build({
    subject: "Your link to edit your Avyakta application",
    heading: "Your application link",
    accent: GOLD,
    badge: "Application link",
    paragraphs: [
      `Hi ${escapeHtml(p.name)},`,
      `Someone just submitted the Avyakta recruitment form again with your SRN. You've already applied, so we haven't created a second application — here is your private link to edit your application or track its status instead.`,
      button(p.editUrl, "Edit or track my application"),
      linkFallback(p.editUrl),
      `This link replaces any earlier one we sent you. If this wasn't you, you can ignore this email — your application hasn't changed.`,
    ],
  });
}

/** 2/3 and 3/3 - a domain's final decision on the candidate. */
export function decisionEmail(p: {
  name: string;
  domain: string;
  accepted: boolean;
  preference: "first" | "second";
  /** First-pref rejection: the second-choice domain now reviewing them, if any. */
  nextDomain?: string | null;
  /** Second-pref decision: the domain that earlier declined them. */
  firstDomain?: string | null;
}): Email {
  const name = escapeHtml(p.name);
  const domain = escapeHtml(p.domain);

  if (p.accepted) {
    return build({
      subject: `Congratulations! You're in - Avyakta ${p.domain}`,
      heading: `Welcome to the ${domain} team!`,
      accent: EMERALD,
      badge: "Accepted",
      paragraphs: [
        `Hi ${name},`,
        `We're delighted to let you know that you've been <strong>accepted</strong> into the <strong>${domain}</strong> domain at Avyakta. Congratulations!`,
        `Your application and interview stood out to the team, and we can't wait to see what you build with us.`,
        `A member of the ${domain} team will get in touch soon with the next steps.` +
          (p.preference === "first" && p.nextDomain
            ? ` Since you've been accepted into ${domain}, your second preference (${escapeHtml(p.nextDomain)}) will not be taken forward — there's no second interview to attend.`
            : ""),
      ],
    });
  }

  if (p.preference === "first" && p.nextDomain) {
    const next = escapeHtml(p.nextDomain);
    return build({
      subject: `Update on your Avyakta application - ${p.domain}`,
      heading: "An update on your application",
      accent: GOLD,
      badge: "Next: second preference",
      paragraphs: [
        `Hi ${name},`,
        `Thank you for your interest in the <strong>${domain}</strong> domain and for the time you put into your application and interview. After careful consideration, we're sorry to let you know that we're unable to offer you a place in <strong>${domain}</strong> this time.`,
        `<strong>Please hold on — this isn't the end of the road.</strong> You also chose <strong>${next}</strong> as your second preference, and that round is coming up soon. The <strong>${next}</strong> team will reach out in the <strong>${next}</strong> WhatsApp group with the details of your second interview, so please keep an eye on it.`,
        `We'll email you again as soon as the ${next} team has made their decision.`,
      ],
    });
  }

  const earlier =
    p.preference === "second" && p.firstDomain
      ? ` We know this follows an earlier update from ${escapeHtml(p.firstDomain)}, and we truly appreciate you staying with the process.`
      : "";

  return build({
    subject: "Update on your Avyakta application",
    heading: "An update on your application",
    accent: CRIMSON,
    badge: "Not selected this time",
    paragraphs: [
      `Hi ${name},`,
      `Thank you for applying to the <strong>${domain}</strong> domain at Avyakta and for the effort you put into your application and interview.`,
      `After careful consideration, we're unable to offer you a place this time.${earlier} This was a competitive round and the decision was not an easy one.`,
      `We'd love to see you at our events and at future recruitment drives. Please don't be discouraged - keep creating, and keep in touch.`,
    ],
  });
}
