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
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract the first JSON object substring
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = text.slice(start, end + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        return { raw: text };
      }
    }
    return { raw: text };
  }
};

const extractStatAny = (source: Record<string, unknown>, key: string) => {
  return extractStat(source, key) ?? extractStat(source.stats as Record<string, unknown>, key);
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

    const npc = parseGeminiJson(text);

    const name = normalizeName(npc.name) || 'Generated NPC';
    const title =
      normalizeName(npc.title) ||
      normalizeName(npc.class) ||
      null;
    const descriptionToUse =
      normalizeName(npc.description) ||
      description;

    const alignment = normalizeEnum(npc.alignment, Alignment);
    const gender = normalizeEnum(npc.gender, Gender);
    const stats = (npc.stats && typeof npc.stats === 'object') ? (npc.stats as Record<string, unknown>) : (typeof npc === 'object' ? (npc as Record<string, unknown>) : undefined);
    const hp = toInt(npc.hp ?? (stats ? (stats as Record<string, unknown>).hp : undefined));
    const ac = toInt(npc.ac ?? (stats ? (stats as Record<string, unknown>).ac : undefined));
    const speed = toInt(npc.speed ?? (stats ? (stats as Record<string, unknown>).speed : undefined));
    const raceId = await findRaceId(npc.race);
    const classId = await findClassId(npc.class);

    const statBlockData = {
      armorClass: ac,
      maxHp: hp,
      speed,
      strength: stats ? extractStatAny(stats, 'strength') : null,
      dexterity: stats ? extractStatAny(stats, 'dexterity') : null,
      constitution: stats ? extractStatAny(stats, 'constitution') : null,
      intelligence: stats ? extractStatAny(stats, 'intelligence') : null,
      wisdom: stats ? extractStatAny(stats, 'wisdom') : null,
      charisma: stats ? extractStatAny(stats, 'charisma') : null,
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
