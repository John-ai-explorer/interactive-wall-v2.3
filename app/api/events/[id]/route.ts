import { NextResponse } from "next/server";
import eventsData from "@/data/events.json";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const event = eventsData.events.find((e) => e.event_id === params.id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}
