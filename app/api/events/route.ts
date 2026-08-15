import { NextResponse } from "next/server";
import eventsData from "@/data/events.json";

export async function GET() {
  return NextResponse.json(eventsData.events);
}
