import { createWorker } from "tesseract.js";

export async function POST(request) {
  try {
    const { imageBase64 } = await request.json();
    const buffer = Buffer.from(imageBase64, "base64");

    const worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    const extracted = parsePrescriptionText(text);

    return Response.json({ success: true, data: extracted, rawText: text });
  } catch (error) {
    console.error("Extraction error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

function parsePrescriptionText(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let doctorName = null;
  let specialty = null;
  let date = null;
  const medications = [];

  const DOSAGE_FORMS = "TABLET|CAPSULE|CAP|TAB|SYRUP|INJ|INJECTION|DROPS|CREAM|OINTMENT";

  for (const line of lines) {
    // Doctor name
    const consultantMatch = line.match(/(?:primary\s+)?consultant\s*:?\s*(.+)/i);
    if (consultantMatch && !doctorName) {
      doctorName = consultantMatch[1].trim();
    }
    if (!doctorName && /^(dr\.?|prof\.?)\s/i.test(line)) {
      doctorName = line.trim();
    }

    // Specialty / department
    const deptMatch = line.match(/department\s*:?\s*(.+)/i);
    if (deptMatch && !specialty) {
      specialty = deptMatch[1].trim();
    }

    // Date (avoid grabbing phone numbers or IDs by requiring a full date shape)
    const dateMatch = line.match(/\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/);
    if (dateMatch && !date && !/phone|tel|hn|id/i.test(line)) {
      date = dateMatch[1];
    }

    // Medications — numbered line starting with a dosage form
    const medLineMatch = line.match(new RegExp(`^\\d+[.)]\\s*(?:${DOSAGE_FORMS})\\s+(.+)`, "i"));
    if (medLineMatch) {
      const rest = medLineMatch[1];

      // Brand name = everything before an opening parenthesis, or before dosage number
      const brandMatch = rest.match(/^([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)?)/);
      const brandName = brandMatch ? brandMatch[1].trim() : rest.trim();

      // Generic name = content inside parentheses, if present
      const genericMatch = rest.match(/\(([^)]+)\)/);
      const genericName = genericMatch ? genericMatch[1].trim() : "";

      const dosageMatch = rest.match(/(\d+(?:\.\d+)?\s?(MG|MCG|ML|G))/i);
      const dosage = dosageMatch ? dosageMatch[1] : "";

      // Instructions: schedule pattern (e.g. 1+0+1), route, duration, timing
      const scheduleMatch = line.match(/\b(\d\+\d\+\d)\b/);
      const routeMatch = line.match(/\b(ORAL|IV|IM|TOPICAL|SUBLINGUAL)\b/i);
      const durationMatch = line.match(/\[([^\]]+)\]/);
      const timingMatch = line.match(/(Before Meal|After Meal|Before Food|After Food|At \d+\s?[AP]M)/i);

      const instructionParts = [
        scheduleMatch ? scheduleMatch[1] : null,
        routeMatch ? routeMatch[1] : null,
        durationMatch ? durationMatch[1] : null,
        timingMatch ? timingMatch[1] : null,
      ].filter(Boolean);

      medications.push({
        name: genericName ? `${brandName} (${genericName})` : brandName,
        dosage,
        instructions: instructionParts.join(", "),
      });
    }
  }

  return { doctorName, specialty, date, medications };
}