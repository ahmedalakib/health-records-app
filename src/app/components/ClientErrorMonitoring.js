"use client";

import { useEffect } from "react";
import { initGlobalErrorListeners } from "../lib/errorLogger";

export default function ClientErrorMonitoring() {
  useEffect(() => {
    initGlobalErrorListeners();
  }, []);

  return null;
}
