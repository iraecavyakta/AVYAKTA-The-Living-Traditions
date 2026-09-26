export type EventStatus = "upcoming" | "past";

export type EventTimelineItem = {
  time: string;
  label: string;
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  date: string;
  status: EventStatus;
  domain: string;
  poster: string;
  venue?: string;
  highlights: string[];
  timeline: EventTimelineItem[];
};

export function inferEventStatus(date: string | null | undefined): EventStatus {
  if (!date) {
    return "upcoming";
  }

  const eventDay = new Date(`${date}T23:59:59`);
  return eventDay.getTime() < Date.now() ? "past" : "upcoming";
}

export function isRegistrationDeadlinePassed(
  deadline: string | null | undefined,
): boolean {
  if (!deadline) {
    return false;
  }

  const deadlineDay = new Date(`${deadline}T23:59:59`);
  return deadlineDay.getTime() < Date.now();
}

export function isRegistrationOpen(event: {
  registration_status?: boolean | null;
  registration_deadline?: string | null;
}): boolean {
  const status = event.registration_status ?? true;
  return status && !isRegistrationDeadlinePassed(event.registration_deadline);
}

export function formatEventDate(date: string | null | undefined): string {
  if (!date) {
    return "Date TBA";
  }

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "Date TBA";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}
