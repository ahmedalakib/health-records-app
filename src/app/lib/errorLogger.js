import { supabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * Global Error Logger for Sanomed Health
 * Automatically captures runtime exceptions, failed API requests, and database errors
 * and logs them directly to the Supabase Cloud `app_errors` table for admin diagnostics.
 */
export async function logAppError({
  error,
  errorType = "client_error",
  severity = "error",
  route = typeof window !== "undefined" ? window.location.pathname : "/",
  metadata = {},
}) {
  try {
    if (!isSupabaseConfigured) {
      console.error("[Local Error Logger]", error);
      return;
    }

    const message =
      typeof error === "string"
        ? error
        : error?.message || "Unknown Application Error";
    const stack = error?.stack || null;
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "Server";

    // Attempt to grab current authenticated user safely
    let currentUserId = null;
    try {
      const { data } = await supabase.auth.getSession();
      currentUserId = data?.session?.user?.id || null;
    } catch (_) {}

    const payload = {
      user_id: currentUserId,
      error_message: message,
      error_stack: stack,
      error_type: errorType,
      severity: severity,
      route: route,
      user_agent: userAgent,
      device_info: {
        screen_width: typeof window !== "undefined" ? window.innerWidth : null,
        screen_height: typeof window !== "undefined" ? window.innerHeight : null,
        language: typeof navigator !== "undefined" ? navigator.language : null,
        platform: typeof navigator !== "undefined" ? navigator.platform : null,
        ...metadata,
      },
      status: "unresolved",
    };

    await supabase.from("app_errors").insert(payload);
  } catch (loggingErr) {
    // Avoid recursive error loops
    console.warn("[Sanomed ErrorLogger] Could not persist error to cloud:", loggingErr);
  }
}

/**
 * Initializes automatic global window listeners for unhandled errors
 */
export function initGlobalErrorListeners() {
  if (typeof window === "undefined") return;

  // Catch unhandled script exceptions
  window.addEventListener("error", (event) => {
    logAppError({
      error: event.error || event.message,
      errorType: "runtime_crash",
      severity: "critical",
      route: window.location.pathname,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Catch unhandled promise rejections (e.g. failed async fetch or Supabase calls)
  window.addEventListener("unhandledrejection", (event) => {
    logAppError({
      error: event.reason,
      errorType: "unhandled_promise_rejection",
      severity: "error",
      route: window.location.pathname,
    });
  });
}
