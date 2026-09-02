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

  for (const line of lines) {
    const consultantMatch = line.match(/(?:primary\s+)?consultant\s*:?\s*(.+)/i);
    if (consultantMatch && !doctorName) {
      doctorName = consultantMatch[1].trim();
    }

    if (!doctorName && /^(dr\.?|prof\.?)\s/i.test(line)) {
      doctorName = line.trim();
    }

    if (/department\s*:?\s*(.+)/i.test(line) && !specialty) {
      const deptMatch = line.match(/department\s*:?\s*(.+)/i);
      specialty = deptMatch[1].trim();
    }

    const dateMatch = line.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
    if (dateMatch && !date) date = dateMatch[1];

    if (/^\d+\.\s*(TABLET|CAPSULE|CAP|TAB)/i.test(line)) {
      const nameMatch = line.match(/\d+\.\s*(?:TABLET|CAPSULE|CAP|TAB)\s+([A-Za-z0-9\-]+)/i);
      const dosageMatch = line.match(/(\d+\s?(MG|MCG|ML))/i);
      medications.push({
        name: nameMatch ? nameMatch[1] : line,
        dosage: dosageMatch ? dosageMatch[1] : "",
        instructions: "",
      });
    }
  }

  return { doctorName, specialty, date, medications };
}