import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateEligibility, type EligibilityAnswers } from "@/lib/eligibility";

/**
 * POST /api/eligibility/check
 * Body: EligibilityAnswers
 * Returns: { results, totalMonthly }
 */
export async function POST(request: NextRequest) {
  try {
    const answers: EligibilityAnswers = await request.json();

    // Validate required fields
    if (!answers.soldierType || !answers.serviceStatus) {
      return NextResponse.json(
        { error: "soldierType and serviceStatus are required" },
        { status: 400 }
      );
    }

    // Calculate eligibility
    const results = calculateEligibility(answers);
    const totalMonthly = results.reduce(
      (sum, r) => sum + (r.monthlyAmount ?? 0),
      0
    );

    // Store in Supabase
    const supabase = createAdminClient();
    const { error: insertError } = await supabase
      .from("eligibility_results")
      .insert({
        results: { answers, rights: results, totalMonthly },
        status: "draft",
      });

    if (insertError) {
      console.error("Failed to store eligibility result:", insertError);
      // Don't fail the request — still return results to user
    }

    return NextResponse.json({
      results,
      totalMonthly,
    });
  } catch (error) {
    console.error("Eligibility check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
