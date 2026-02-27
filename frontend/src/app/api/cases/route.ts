import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const volunteerId = searchParams.get("volunteerId");

    let query = supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (status) {
      query = query.eq("case_status", status);
    }
    if (volunteerId) {
      query = query.eq("assigned_volunteer_id", volunteerId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cases: data });
  } catch (error) {
    console.error("Cases GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("cases")
      .insert({
        user_id: body.userId,
        title: body.title,
        notes: body.notes,
        priority: body.priority || "medium",
        case_status: "open",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ case: data }, { status: 201 });
  } catch (error) {
    console.error("Cases POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
