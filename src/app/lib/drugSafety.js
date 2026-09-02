// Clinical Drug-Allergy Safety & Interaction Guidelines

const DRUG_FAMILIES = [
  {
    classId: "penicillins",
    className: "Penicillin & Beta-Lactam Antibiotics",
    allergenTriggers: ["penicillin", "penicilin", "amoxicillin", "amoxil", "augmentin", "ampicillin", "beta-lactam"],
    drugs: [
      "penicillin", "amoxicillin", "augmentin", "ampicillin", "piperacillin",
      "amoxil", "amoxicillin-clavulanate", "oxacillin", "cloxacillin", "dicloxacillin"
    ],
    crossReactive: ["cephalexin", "keflex", "ceftriaxone", "cefuroxime", "cefaclor", "cefazolin"],
    warning: "Belongs to the Penicillin family. May trigger severe allergic reactions (hives, anaphylaxis, breathing difficulty) in patients allergic to Penicillin.",
    crossWarning: "Belongs to the Cephalosporin class, which shares chemical similarity and cross-reactivity with Penicillin.",
  },
  {
    classId: "sulfas",
    className: "Sulfonamide ('Sulfa') Antibiotics",
    allergenTriggers: ["sulfa", "sulfonamide", "bactrim", "septra"],
    drugs: [
      "bactrim", "septra", "sulfamethoxazole", "trimethoprim-sulfamethoxazole",
      "sulfasalazine", "sulfadiazine", "sulfisoxazole", "zonegran", "zonisamide"
    ],
    crossReactive: ["celecoxib", "celebrex", "furosemide", "hydrochlorothiazide"],
    warning: "Contains a Sulfonamide compound. Potential for severe rash or allergic response in patients with a Sulfa allergy.",
    crossWarning: "Contains a non-antibiotic sulfonamide group that may carry mild sensitivity in sulfa-allergic patients.",
  },
  {
    classId: "nsaids",
    className: "NSAIDs (Nonsteroidal Anti-inflammatory Drugs)",
    allergenTriggers: ["aspirin", "nsaid", "nsaids", "ibuprofen", "advil", "motrin", "naproxen", "aleve"],
    drugs: [
      "aspirin", "ibuprofen", "advil", "motrin", "naproxen", "aleve",
      "diclofenac", "voltaren", "meloxicam", "mobic", "ketorolac", "toradol",
      "indomethacin", "piroxicam", "nabumetone", "etodolac", "celecoxib", "celebrex"
    ],
    crossReactive: [],
    warning: "Belongs to the NSAID/Aspirin family. Cross-reactivity between Aspirin and other NSAIDs is common; can provoke bronchospasm, hives, or swelling.",
    crossWarning: "",
  },
  {
    classId: "opioids",
    className: "Opioid Analgesics",
    allergenTriggers: ["codeine", "morphine", "opioid", "opioids", "narcotics", "tramadol", "oxycodone"],
    drugs: [
      "codeine", "morphine", "oxycodone", "oxycontin", "percocet",
      "hydrocodone", "vicodin", "norco", "tramadol", "ultram", "fentanyl",
      "hydromorphone", "dilaudid", "buprenorphine"
    ],
    crossReactive: [],
    warning: "Belongs to the Opioid analgesic class. Cross-sensitivity across opioids can cause dangerous respiratory depression, itching, or anaphylaxis.",
    crossWarning: "",
  },
  {
    classId: "macrolides",
    className: "Macrolide Antibiotics",
    allergenTriggers: ["macrolide", "azithromycin", "zithromax", "erythromycin", "clarithromycin"],
    drugs: [
      "azithromycin", "zithromax", "z-pack", "erythromycin", "clarithromycin", "biaxin"
    ],
    crossReactive: [],
    warning: "Belongs to the Macrolide class. Can trigger severe gastrointestinal disturbance, hives, or allergic swelling.",
    crossWarning: "",
  },
];

const MEDICATION_TIPS = [
  {
    keywords: ["metformin", "glucophage"],
    tip: "Take with meals or after food to minimize gastrointestinal discomfort.",
  },
  {
    keywords: ["atorvastatin", "simvastatin", "rosuvastatin", "lipitor", "crestor", "zocor"],
    tip: "Best taken in the evening. Avoid consuming large quantities of grapefruit juice.",
  },
  {
    keywords: ["ibuprofen", "advil", "motrin", "naproxen", "aleve", "aspirin", "diclofenac"],
    tip: "Take with food, milk, or a full glass of water to protect your stomach lining.",
  },
  {
    keywords: ["amoxicillin", "augmentin", "azithromycin", "ciprofloxacin", "bactrim", "keflex", "cephalexin"],
    tip: "Complete the entire prescribed duration even if symptoms improve early.",
  },
  {
    keywords: ["lisinopril", "losartan", "amlodipine", "metoprolol", "atenolol"],
    tip: "Take at consistent times daily. Report any persistent dry cough or dizziness.",
  },
  {
    keywords: ["levothyroxine", "synthroid"],
    tip: "Take first thing in the morning on an empty stomach with water, 30-60 mins before food.",
  },
  {
    keywords: ["omeprazole", "pantoprazole", "esomeprazole", "prilosec", "nexium"],
    tip: "Take 30-60 minutes before your first meal of the day.",
  },
];

// Check if a medication conflicts with any user-documented allergies
export function checkDrugAllergy(medName = "", userAllergies = "") {
  if (!medName || !userAllergies) return null;

  const cleanMed = medName.toLowerCase().trim();
  const rawAllergies = userAllergies.toLowerCase();

  // Split allergies into tokens by comma, slash, semicolon, or "and"
  const allergyTokens = rawAllergies
    .split(/[,;/]|\band\b/)
    .map((t) => t.trim())
    .filter(Boolean);

  for (const family of DRUG_FAMILIES) {
    // Check if user has an allergy matching this family
    const matchedTrigger = family.allergenTriggers.find((trigger) =>
      allergyTokens.some((token) => token.includes(trigger))
    );

    if (matchedTrigger) {
      // Direct drug match in this family
      const isDirectMatch = family.drugs.some((d) => cleanMed.includes(d) || d.includes(cleanMed));
      if (isDirectMatch) {
        return {
          hasWarning: true,
          severity: "high",
          allergen: matchedTrigger,
          drugClass: family.className,
          message: family.warning,
          matchedDrug: cleanMed,
        };
      }

      // Cross-reactive match in this family
      const isCrossMatch = family.crossReactive.some((d) => cleanMed.includes(d) || d.includes(cleanMed));
      if (isCrossMatch) {
        return {
          hasWarning: true,
          severity: "warning",
          allergen: matchedTrigger,
          drugClass: family.className,
          message: family.crossWarning,
          matchedDrug: cleanMed,
        };
      }
    }
  }

  // Direct keyword fallback (e.g. if allergy is "Peanuts" and user entered "Peanut oil")
  for (const token of allergyTokens) {
    if (token.length >= 3 && cleanMed.includes(token)) {
      return {
        hasWarning: true,
        severity: "high",
        allergen: token,
        drugClass: "Reported Allergen Match",
        message: `Name closely matches your documented allergy: "${token}". Verify with your pharmacist before taking.`,
        matchedDrug: cleanMed,
      };
    }
  }

  return null;
}

// Retrieve food and administration tips for a medication
export function getMedicationTips(medName = "") {
  if (!medName) return null;
  const clean = medName.toLowerCase().trim();
  for (const item of MEDICATION_TIPS) {
    if (item.keywords.some((k) => clean.includes(k))) {
      return item.tip;
    }
  }
  return null;
}
