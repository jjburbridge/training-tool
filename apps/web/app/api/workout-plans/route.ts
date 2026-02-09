import { NextRequest, NextResponse } from "next/server";
import { client } from "../../lib/sanity/client";
import {
  WORKOUT_PLANS_PAGINATED_QUERY,
  WORKOUT_PLANS_COUNT_QUERY,
} from "../../lib/sanity/queries";

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));
    const pageSize = Math.min(
      PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10))
    );
    const end = offset + pageSize;

    const [workoutPlans, total] = await Promise.all([
      client.fetch(WORKOUT_PLANS_PAGINATED_QUERY, { offset, end }),
      client.fetch<number>(WORKOUT_PLANS_COUNT_QUERY),
    ]);

    return NextResponse.json({
      workoutPlans,
      total,
      hasMore: offset + workoutPlans.length < total,
    });
  } catch (error) {
    console.error("Error fetching workout plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout plans" },
      { status: 500 }
    );
  }
}
