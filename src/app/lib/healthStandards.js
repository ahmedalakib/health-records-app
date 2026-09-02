// Health standards and clinical reference ranges

export function evaluateVital(type, rawValue) {
  if (!rawValue) return null;

  const cleanType = (type || "").trim().toLowerCase();
  const valueStr = String(rawValue).trim();

  // 1. Blood Pressure (e.g. "120/80")
  if (cleanType.includes("pressure") || cleanType === "bp") {
    const parts = valueStr.split(/[/|\-\s]+/).map((p) => parseFloat(p)).filter((n) => !isNaN(n));
    if (parts.length >= 2) {
      const [systolic, diastolic] = parts;

      if (systolic >= 180 || diastolic >= 120) {
        return {
          status: "Crisis",
          level: "critical",
          badgeBg: "#FEE2E2",
          badgeText: "#991B1B",
          borderColor: "#FCA5A5",
          desc: "Hypertensive Crisis (Seek medical care)",
          parsed: { systolic, diastolic },
        };
      }
      if (systolic >= 140 || diastolic >= 90) {
        return {
          status: "High (Stage 2)",
          level: "danger",
          badgeBg: "#FFEDD5",
          badgeText: "#9A3412",
          borderColor: "#FDBA74",
          desc: "Stage 2 Hypertension",
          parsed: { systolic, diastolic },
        };
      }
      if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
        return {
          status: "High (Stage 1)",
          level: "caution",
          badgeBg: "#FEF3C7",
          badgeText: "#92400E",
          borderColor: "#FCD34D",
          desc: "Stage 1 Hypertension",
          parsed: { systolic, diastolic },
        };
      }
      if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
        return {
          status: "Elevated",
          level: "warning",
          badgeBg: "#FEF9C3",
          badgeText: "#854D0E",
          borderColor: "#FDE047",
          desc: "Elevated Blood Pressure",
          parsed: { systolic, diastolic },
        };
      }
      if (systolic < 90 || diastolic < 60) {
        return {
          status: "Low",
          level: "warning",
          badgeBg: "#E0F2FE",
          badgeText: "#075985",
          borderColor: "#BAE6FD",
          desc: "Hypotension (Low BP)",
          parsed: { systolic, diastolic },
        };
      }
      return {
        status: "Normal",
        level: "normal",
        badgeBg: "#DCFCE7",
        badgeText: "#166534",
        borderColor: "#86EFAC",
        desc: "Optimal Blood Pressure (<120/80)",
        parsed: { systolic, diastolic },
      };
    }
  }

  // Extract first numeric value for single-value vitals
  const numMatch = valueStr.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!numMatch) return null;
  const num = parseFloat(numMatch[0]);

  // 2. Glucose (e.g. "95", "110 mg/dL", "6.2 mmol/L")
  if (cleanType.includes("glucose") || cleanType.includes("sugar")) {
    const isMmol = valueStr.toLowerCase().includes("mmol") || num < 25;
    const mgDl = isMmol ? num * 18.0182 : num;

    if (mgDl < 70) {
      return {
        status: "Low",
        level: "danger",
        badgeBg: "#E0F2FE",
        badgeText: "#075985",
        borderColor: "#BAE6FD",
        desc: "Hypoglycemia (<70 mg/dL)",
        parsed: { value: num, unit: isMmol ? "mmol/L" : "mg/dL" },
      };
    }
    if (mgDl <= 99) {
      return {
        status: "Normal",
        level: "normal",
        badgeBg: "#DCFCE7",
        badgeText: "#166534",
        borderColor: "#86EFAC",
        desc: "Fasting normal (70-99 mg/dL)",
        parsed: { value: num, unit: isMmol ? "mmol/L" : "mg/dL" },
      };
    }
    if (mgDl <= 125) {
      return {
        status: "Elevated",
        level: "warning",
        badgeBg: "#FEF3C7",
        badgeText: "#92400E",
        borderColor: "#FCD34D",
        desc: "Pre-diabetes range (100-125 mg/dL)",
        parsed: { value: num, unit: isMmol ? "mmol/L" : "mg/dL" },
      };
    }
    return {
      status: "High",
      level: "danger",
      badgeBg: "#FEE2E2",
      badgeText: "#991B1B",
      borderColor: "#FCA5A5",
      desc: "High Glucose (≥126 mg/dL fasting)",
      parsed: { value: num, unit: isMmol ? "mmol/L" : "mg/dL" },
    };
  }

  // 3. Heart Rate (e.g. "72 bpm")
  if (cleanType.includes("heart") || cleanType.includes("pulse") || cleanType === "hr") {
    if (num < 60) {
      return {
        status: "Low (Bradycardia)",
        level: "warning",
        badgeBg: "#E0F2FE",
        badgeText: "#075985",
        borderColor: "#BAE6FD",
        desc: "Below 60 bpm",
        parsed: { value: num, unit: "bpm" },
      };
    }
    if (num <= 100) {
      return {
        status: "Normal",
        level: "normal",
        badgeBg: "#DCFCE7",
        badgeText: "#166534",
        borderColor: "#86EFAC",
        desc: "Normal resting heart rate (60-100 bpm)",
        parsed: { value: num, unit: "bpm" },
      };
    }
    return {
      status: "High (Tachycardia)",
      level: "danger",
      badgeBg: "#FEE2E2",
      badgeText: "#991B1B",
      borderColor: "#FCA5A5",
      desc: "Elevated resting heart rate (>100 bpm)",
      parsed: { value: num, unit: "bpm" },
    };
  }

  // 4. Temperature (e.g. "98.6 F" or "37 C")
  if (cleanType.includes("temp")) {
    const isCelsius = valueStr.toLowerCase().includes("c") || num < 45;
    const fahrenheit = isCelsius ? (num * 9) / 5 + 32 : num;

    if (fahrenheit < 95) {
      return {
        status: "Hypothermia",
        level: "critical",
        badgeBg: "#E0F2FE",
        badgeText: "#075985",
        borderColor: "#BAE6FD",
        desc: "Abnormally low body temp (<95°F)",
        parsed: { value: num, unit: isCelsius ? "°C" : "°F" },
      };
    }
    if (fahrenheit <= 99.0) {
      return {
        status: "Normal",
        level: "normal",
        badgeBg: "#DCFCE7",
        badgeText: "#166534",
        borderColor: "#86EFAC",
        desc: "Normal body temperature (97.0-99.0°F)",
        parsed: { value: num, unit: isCelsius ? "°C" : "°F" },
      };
    }
    if (fahrenheit < 100.4) {
      return {
        status: "Low Fever",
        level: "warning",
        badgeBg: "#FEF3C7",
        badgeText: "#92400E",
        borderColor: "#FCD34D",
        desc: "Mild / Low-grade fever",
        parsed: { value: num, unit: isCelsius ? "°C" : "°F" },
      };
    }
    return {
      status: "Fever",
      level: "danger",
      badgeBg: "#FEE2E2",
      badgeText: "#991B1B",
      borderColor: "#FCA5A5",
      desc: "High temperature (≥100.4°F / 38°C)",
      parsed: { value: num, unit: isCelsius ? "°C" : "°F" },
    };
  }

  // 5. Weight
  if (cleanType.includes("weight")) {
    const isKg = valueStr.toLowerCase().includes("kg") || (!valueStr.toLowerCase().includes("lb") && num < 180);
    return {
      status: "Logged",
      level: "normal",
      badgeBg: "#F3F4F6",
      badgeText: "#374151",
      borderColor: "#E5E7EB",
      desc: `${num} ${isKg ? "kg" : "lbs"}`,
      parsed: { value: num, unit: isKg ? "kg" : "lbs" },
    };
  }

  return null;
}
