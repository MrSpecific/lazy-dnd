export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { generateGeminiText } from '@/lib/gemini';
import prisma from '@/lib/prisma';
import { Alignment, Gender } from '@prisma/client';

const buildPrompt = (description: string) => {
  return `
Generate a concise NPC for D&D 5e as JSON ONLY.
Include: name, gender, race, class, alignment, title, description, stats (strength,dexterity,constitution,intelligence,wisdom,charisma as integers 3-20), hp (max), ac, speed, inventory (array of strings).
Use this player-provided description to guide flavor: "${description}".
Respond with valid JSON and nothing else.`;
};

const normalizeEnum = <T extends Record<string, string>>(
  value: unknown,
  enumObj: T
): T[keyof T] | null => {
  if (typeof value !== 'string') return null;
  const key = value
    .toUpperCase()
    .replace(/[^A-Z]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const matchedKey = Object.keys(enumObj).find((enumKey) => enumKey === key);
  return matchedKey ? enumObj[matchedKey as keyof T] : null;
};

const toInt = (value: unknown): number | null => {
  if (typeof value === 'string') {
    const match = value.match(/-?\d+/);
    if (match) {
      const parsed = Number(match[0]);
      return Number.isFinite(parsed) ? Math.round(parsed) : null;
    }
  }
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : null;
};

const extractStat = (stats: Record<string, unknown> | undefined, key: string) => {
  if (!stats) return null;
  const normalizedStats = Object.fromEntries(
    Object.entries(stats).map(([k, v]) => [k.toLowerCase(), v])
  );
  return toInt(normalizedStats[key.toLowerCase()]);
};

const normalizeName = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const findClassId = async (raw: unknown) => {
  const name = normalizeName(raw);
  if (!name) return null;
  const found = await prisma.characterClass.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
  return found?.id ?? null;
};

const findRaceId = async (raw: unknown) => {
  const name = normalizeName(raw);
  if (!name) return null;
  const found = await prisma.race.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
  return found?.id ?? null;
};

// Gemini sometimes wraps JSON in code fences or prefixes text; try to salvage the JSON object.
const parseGeminiJson = (text: string) => {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    // Try to extract the first JSON object substring
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const inner = candidate.slice(start, end + 1);
      try {
        return JSON.parse(inner);
      } catch {
        return { raw: text };
      }
    }
    return { raw: text };
  }
};

const extractStatAny = (source: Record<string, unknown>, key: string) => {
  const direct = extractStat(source, key);
  if (direct != null) return direct;
  const stats =
    (source.stats as Record<string, unknown>) ??
    (source.statBlock as Record<string, unknown>) ??
    (source.stat_block as Record<string, unknown>) ??
    (source.abilities as Record<string, unknown>);
  return extractStat(stats, key);
};

const extractFlat = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const val = source[key];
    const parsed = toInt(val);
    if (parsed != null) return parsed;
  }
  return null;
};

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ or: 'return-null' });
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { description?: string };
    const description = body.description?.trim();
    if (!description) {
      return NextResponse.json({ message: 'Description is required' }, { status: 400 });
    }

    const prompt = buildPrompt(description);
    const { text } = await generateGeminiText(prompt, { maxOutputTokens: 256, temperature: 0.8 });

    const npc = parseGeminiJson(text) as Record<string, unknown>;

    const name = normalizeName(npc.name ?? npc.npcName ?? npc.fullName) || 'Generated NPC';
    const title =
      normalizeName(npc.title) ||
      normalizeName(npc.class) ||
      null;
    const descriptionToUse =
      normalizeName(npc.description) ||
      description;

    const alignment = normalizeEnum(npc.alignment ?? npc.align, Alignment);
    const gender = normalizeEnum(npc.gender ?? npc.sex, Gender);
    const hp = extractFlat(npc, ['hp', 'hitPoints', 'hit_points', 'maxHp', 'max_hp']);
    const ac = extractFlat(npc, ['ac', 'armorClass', 'armor_class']);
    const speed = extractFlat(npc, ['speed', 'speedFt', 'speed_ft']);
    const raceId = await findRaceId(npc.race ?? npc.raceName);
    const classId = await findClassId(npc.class ?? npc.className);

    const statBlockData = {
      armorClass: ac ?? extractStatAny(npc, 'ac') ?? extractStatAny(npc, 'armorclass'),
      maxHp: hp ?? extractStatAny(npc, 'hp') ?? extractStatAny(npc, 'maxhp'),
      speed: speed ?? extractStatAny(npc, 'speed'),
      strength: extractStatAny(npc, 'strength'),
      dexterity: extractStatAny(npc, 'dexterity'),
      constitution: extractStatAny(npc, 'constitution'),
      intelligence: extractStatAny(npc, 'intelligence'),
      wisdom: extractStatAny(npc, 'wisdom'),
      charisma: extractStatAny(npc, 'charisma'),
    };

    const hasStatBlock = Object.values(statBlockData).some((value) => value !== null);

    const created = await prisma.npc.create({
      data: {
        name,
        title,
        description: descriptionToUse,
        createdById: user.id,
        alignment,
        gender,
        raceId,
        classId,
        ...(hasStatBlock && {
          statBlock: { create: statBlockData },
        }),
      },
      select: { id: true },
    });

    return NextResponse.json({ npc, id: created.id });
  } catch (error) {
    console.error('failed to generate npc', error);
    const message = error instanceof Error ? error.message : 'Failed to generate NPC';
    return NextResponse.json({ message }, { status: 500 });
  }
}
