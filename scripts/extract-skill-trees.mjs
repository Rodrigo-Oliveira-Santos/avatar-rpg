// Extracts skill data from docs/*_skill_tree.html into JSON files.
// Run: node scripts/extract-skill-trees.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SOURCES = [
  { file: 'fire_skill_tree.html',       element: 'fire',     path: null },
  { file: 'water_skill_tree.html',      element: 'water',    path: null },
  { file: 'earth_skill_tree.html',      element: 'earth',    path: null },
  { file: 'air_skill_tree.html',        element: 'air',      path: null },
  { file: 'chiblocker_skill_tree.html', element: 'none',     path: 'chiblocker' },
  { file: 'weapons_skill_tree.html',    element: 'none',     path: 'weapons' },
];

const BRANCH_TO_CATEGORY = {
  sp: 'spirit',
  ag: 'agility',
  cb: 'combat',     // shared N1-N2
  pr: 'precise',
  br: 'brute',
};

const TIER_INDEX_TO_TIER = (tIdx) => tIdx + 1;  // file uses 0-based tiers; spec is 1-based, with 5=Legendary
const isLegendaryTier = (tIdx) => tIdx >= 4;

function extractBlock(src, varName) {
  // Find: const VAR={ ... };
  const re = new RegExp(`const\\s+${varName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\}\\s*;`, 'm');
  const m = src.match(re);
  if (!m) return null;
  return `{${m[1]}\n}`;
}

function extractArray(src, varName) {
  const re = new RegExp(`const\\s+${varName}\\s*=\\s*\\[([\\s\\S]*?)\\n\\]\\s*;`, 'm');
  const m = src.match(re);
  if (!m) return null;
  return `[${m[1]}\n]`;
}

function safeEval(jsLiteral) {
  // Evaluate a JS literal in a sandbox-ish way. The HTMLs are local & trusted.
  // We allow trailing commas and JS-style unquoted keys by using Function().
  return Function(`"use strict"; return (${jsLiteral});`)();
}

async function extractFile(srcFile, element, nonBenderPath) {
  const html = await readFile(path.join('docs', srcFile), 'utf8');

  const areqStr = extractBlock(html, 'AREQ');
  const maeStr  = extractBlock(html, 'MAE');
  const rawStr  = extractArray(html, 'RAW');

  if (!areqStr || !maeStr || !rawStr) {
    throw new Error(`Could not extract data from ${srcFile}`);
  }

  const AREQ = safeEval(areqStr);
  const MAE  = safeEval(maeStr);
  const RAW  = safeEval(rawStr);

  const skills = RAW.map((n) => {
    const tIdx = n.t;
    const tier = TIER_INDEX_TO_TIER(tIdx);
    const branch = n.b;
    const category = BRANCH_TO_CATEGORY[branch] || branch;

    return {
      id: `${element}-${nonBenderPath ? nonBenderPath + '-' : ''}${n.id}`,
      raw_id: n.id,
      name: n.l.replace(/\n/g, ' '),
      element,
      non_bender_path: nonBenderPath,
      branch,                              // sp | ag | cb | pr | br
      category,                            // human-friendly
      tier,                                // 1..5 (5 = Lendário)
      is_legendary: isLegendaryTier(tIdx),
      tier_label: n.tl,
      description: n.ds || '',
      damage_summary: n.dmg || '',
      requirements_text: n.req || '',
      attribute_requirements: AREQ[n.id] || {},
      prerequisites: (n.deps || []).map((dep) => `${element}-${nonBenderPath ? nonBenderPath + '-' : ''}${dep}`),
      prerequisites_raw: n.deps || [],
      mastery_levels: (MAE[n.id]?.l) || null,   // [M0, M1, M2, M3] strings or null
      position: { column: n.c, y_offset: n.yo || 0 },
    };
  });

  return { element, non_bender_path: nonBenderPath, skills };
}

async function main() {
  await mkdir('data/skills', { recursive: true });
  const summary = [];
  for (const src of SOURCES) {
    const out = await extractFile(src.file, src.element, src.path);
    const fname = src.path
      ? `data/skills/${src.element}-${src.path}.json`
      : `data/skills/${src.element}.json`;
    await writeFile(fname, JSON.stringify(out, null, 2));
    summary.push({ file: fname, count: out.skills.length });
  }
  console.log('Extracted:');
  summary.forEach((s) => console.log(`  ${s.file}: ${s.count} skills`));
}

main().catch((e) => { console.error(e); process.exit(1); });
