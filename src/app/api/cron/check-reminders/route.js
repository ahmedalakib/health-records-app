import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "../../../lib/supabaseClient";

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@sanomed.health",
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function GET(req) {
  return handleCheckReminders(req);
}

export async function POST(req) {
  return handleCheckReminders(req);
}

async function handleCheckReminders(req) {
  try {
    // Optional cron secret protection
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In development or if CRON_SECRET is not set, allow execution
      if (process.env.NODE_ENV === "production" && cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: "VAPID keys not configured in environment" },
        { status: 500 }
      );
    }

    // 1. Fetch active push subscriptions
    const { data: subscriptions, error: subErr } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("is_active", true);

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: "No active push subscriptions found", count: 0 });
    }

    let sentCount = 0;
    let expiredEndpoints = [];

    // 2. Iterate each subscribed user and check their medications
    for (const sub of subscriptions) {
      try {
        const userTz = sub.timezone || "UTC";
        
        // Get local time for user
        let userHour = 8; // fallback
        try {
          const nowStr = new Intl.DateTimeFormat("en-US", {
            timeZone: userTz,
            hour: "numeric",
            hour12: false,
          }).format(new Date());
          userHour = parseInt(nowStr, 10);
        } catch (tzErr) {
          userHour = new Date().getUTCHours();
        }

        // Fetch active medications for user
        const { data: meds } = await supabase
          .from("medications")
          .select("name, dosage, frequency")
          .eq("user_id", sub.user_id);

        if (!meds || meds.length === 0) continue;

        // Determine matching dose slot based on hour
        let slotName = null;
        if (userHour >= 7 && userHour <= 9) {
          slotName = "Morning";
        } else if (userHour >= 12 && userHour <= 14) {
          slotName = "Afternoon";
        } else if (userHour >= 19 && userHour <= 21) {
          slotName = "Evening";
        }

        if (!slotName) {
          // Outside standard reminder windows
          continue;
        }

        // Filter medications that apply to this slot
        const relevantMeds = meds.filter((m) => {
          const f = (m.frequency || "").toLowerCase();
          if (slotName === "Morning") return true;
          if (slotName === "Afternoon") return f.includes("3x") || f.includes("three") || f.includes("tid") || f.includes("noon") || f.includes("afternoon");
          if (slotName === "Evening") return f.includes("2x") || f.includes("twice") || f.includes("bid") || f.includes("3x") || f.includes("night") || f.includes("evening") || f.includes("pm");
          return false;
        });

        if (relevantMeds.length === 0) continue;

        const medNames = relevantMeds.slice(0, 3).map((m) => m.name).join(", ");
        const payload = JSON.stringify({
          title: `💊 ${slotName} Medication Reminder`,
          body: `Time to take your scheduled dose: ${medNames}${relevantMeds.length > 3 ? " and others" : ""}.`,
          url: "/",
        });

        try {
          await webpush.sendNotification(sub.subscription, payload);
          sentCount++;
        } catch (pushErr) {
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            // Subscription expired or uninstalled
            expiredEndpoints.push(sub.endpoint);
          }
        }
      } catch (userLoopErr) {
        console.warn("Error processing user push reminder:", userLoopErr);
      }
    }

    // Cleanup expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .update({ is_active: false })
        .in("endpoint", expiredEndpoints);
    }

    return NextResponse.json({
      success: true,
      subscriptionsChecked: subscriptions.length,
      notificationsSent: sentCount,
      expiredDeactivated: expiredEndpoints.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cron check-reminders error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
