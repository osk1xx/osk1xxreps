import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type TrackEvent = {
  time: string;
  location: string;
  description: string;
};

export type TrackResult = {
  found: boolean;
  trackedNumber: string;
  status: string;
  syncTime: string;
  carriers: string[];
  carrierCode: string;
  events: TrackEvent[];
};

// 17track internal carrier keys for the user-requested carriers.
const CARRIERS: { label: string; code: number }[] = [
  { label: "LDTGYL", code: 191272 },
  { label: "YHGJ", code: 191684 },
];

const inputSchema = z.object({
  num: z
    .string()
    .trim()
    .min(4, "Tracking number is too short")
    .max(60, "Tracking number is too long")
    .regex(/^[A-Za-z0-9-]+$/, "Invalid tracking number"),
});

const extractSchema = {
  type: "object",
  properties: {
    found: { type: "boolean" },
    tracked_number: { type: "string" },
    status: { type: "string" },
    sync_time: { type: "string" },
    carriers: { type: "array", items: { type: "string" } },
    events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          time: { type: "string" },
          location: { type: "string" },
          description: { type: "string" },
        },
      },
    },
  },
} as const;

async function scrapeCarrier(
  num: string,
  carrier: { label: string; code: number },
  apiKey: string,
): Promise<TrackResult | null> {
  const url = `https://t.17track.net/en#nums=${encodeURIComponent(num)}&fc=${carrier.code}`;
  const body = {
    url,
    formats: ["json"],
    waitFor: 11000,
    timeout: 45000,
    jsonOptions: {
      prompt:
        "Extract the parcel tracking result shown on this 17track page. Return the tracked number string exactly as shown, the overall status text, the carriers list, the sync time, and the full list of tracking events (each with its date-time, location and description). If the page only shows a demo/sample placeholder (for example a number like 'TestNumber00017') or no real tracking result for the searched number, set found to false.",
      schema: extractSchema,
    },
  };

  let resp: Response;
  try {
    resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
  if (!resp.ok) return null;

  let json: any;
  try {
    json = await resp.json();
  } catch {
    return null;
  }
  const data = json?.data?.json;
  if (!data) return null;

  const events: TrackEvent[] = Array.isArray(data.events)
    ? data.events
        .map((e: any) => ({
          time: String(e?.time ?? "").trim(),
          location: String(e?.location ?? "").trim(),
          description: String(e?.description ?? "").trim(),
        }))
        .filter((e: TrackEvent) => e.time || e.description)
    : [];

  const tracked = String(data.tracked_number ?? "").trim();
  // Guard against 17track's demo data: number must loosely match the query.
  const normQuery = num.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const normTracked = tracked.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const numberMatches = normTracked.length > 0 && normTracked === normQuery;

  const found = Boolean(data.found) && numberMatches && events.length > 0;
  if (!found) return null;

  return {
    found: true,
    trackedNumber: tracked || num,
    status: String(data.status ?? "").trim(),
    syncTime: String(data.sync_time ?? "").trim(),
    carriers: Array.isArray(data.carriers)
      ? data.carriers.map((c: any) => String(c).trim()).filter(Boolean)
      : [],
    carrierCode: carrier.label,
    events,
  };
}

export const trackParcel = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<TrackResult> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error("Tracking service is not configured.");
    }

    for (const carrier of CARRIERS) {
      const result = await scrapeCarrier(data.num, carrier, apiKey);
      if (result) return result;
    }

    return {
      found: false,
      trackedNumber: data.num,
      status: "",
      syncTime: "",
      carriers: [],
      carrierCode: "",
      events: [],
    };
  });
