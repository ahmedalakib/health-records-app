import { NextResponse } from "next/server";
import webpush from "web-push";

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@healthkeep.app",
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function POST(req) {
  try {
    const { subscription, title, body, url } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription object provided" },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: title || "💊 Medication Reminder",
      body: body || "It is time to take your scheduled dose!",
      url: url || "/",
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Web Push Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}
