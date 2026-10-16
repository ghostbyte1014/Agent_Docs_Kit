// Time-zone handling for generated change-record instructions.
// `setup` bakes the resolved description into AGENTS.md so no generated file
// hardcodes one maintainer's local zone.

export const defaultTimezone = "UTC";

export function isSupportedTimezone(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  if (value === "local" || value === "UTC") return true;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function assertTimezone(value, label = "timezone") {
  if (!isSupportedTimezone(value)) {
    throw new Error(`${label} must be 'UTC', 'local', or an IANA time-zone name such as 'Europe/Berlin'. Received '${value}'.`);
  }
  return value;
}

// Human-readable phrase used inside generated instructions.
export function describeTimezone(timezone = defaultTimezone) {
  if (timezone === "local") return "the device's local time zone";
  if (timezone === "UTC") return "UTC";
  return timezone;
}

// Shell hint an agent can run to read the clock in the configured zone.
export function timezoneClockCommand(timezone = defaultTimezone) {
  if (timezone === "local") return "date +%Y-%m-%d_%H%M";
  if (timezone === "UTC") return "date -u +%Y-%m-%d_%H%M";
  return `TZ=${timezone} date +%Y-%m-%d_%H%M`;
}

export function timezoneDate(timezone = defaultTimezone, value = new Date()) {
  if (timezone === "local") {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}
