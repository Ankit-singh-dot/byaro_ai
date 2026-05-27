// ============================================================
// AstroVault — Attack Templates API
// GET /api/templates
// Merges hardcoded templates + Gandalf/Lakera dataset
// ============================================================

import { ATTACK_TEMPLATES } from "@/lib/templates";
import { promises as fs } from "fs";
import path from "path";

let gandalfCache: typeof ATTACK_TEMPLATES | null = null;

async function loadGandalfTemplates() {
  if (gandalfCache) return gandalfCache;
  try {
    const filePath = path.join(process.cwd(), "data", "gandalf-templates.json");
    const raw = await fs.readFile(filePath, "utf-8");
    gandalfCache = JSON.parse(raw);
    return gandalfCache;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source"); // "builtin" | "gandalf" | null (all)
  const category = searchParams.get("category"); // filter by category

  const gandalf = await loadGandalfTemplates();
  
  let templates = [
    ...ATTACK_TEMPLATES,
    ...(gandalf || []),
  ];

  if (source === "builtin") {
    templates = [...ATTACK_TEMPLATES];
  } else if (source === "gandalf") {
    templates = [...(gandalf || [])];
  }

  if (category) {
    templates = templates.filter(
      (t) => t.category === category
    );
  }

  return Response.json({
    templates,
    total: templates.length,
    sources: {
      builtin: ATTACK_TEMPLATES.length,
      gandalf: gandalf?.length || 0,
    },
  });
}
