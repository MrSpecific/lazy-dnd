'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { generateGeminiText } from '@/lib/gemini';
import { Alignment, Gender } from '@prisma/client';

export type GenerateNpcState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; id: string; npc?: Record<string, unknown> }
  | { status: 'error'; message: string };

const buildPrompt = (description: string) => {
  return `
Generate a concise NPC for D&D 5e as JSON ONLY.
Include: name, gender, race, class, alignment, title, description, stats (strength,dexterity,constitution,intelligence,wisdom,charisma as integers 3-20), hp (max), ac, speed, inventory (array of strings).
Use this player-provided description to guide flavor: "${description}".
Respond with a single JSON object using those top-level keys only. Do not wrap in an outer "npc" or "data" object.`;
};

const normalizeName = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const normalizeKey = (key: string) =>
  key
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const getField = (source: Record<string, unknown>, ...keys: string[]) => {
  const sourceKeys = Object.keys(source);
  for (const key of keys) {
    if (key in source) return source[key];
    const normalized = normalizeKey(key);
    const matched = sourceKeys.find((sourceKey) => normalizeKey(sourceKey) === normalized);
    if (matched) return source[matched];
  }
  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const firstRecordInArray = (value: unknown): Record<string, unknown> | null => {
  if (!Array.isArray(value)) return null;
  for (const item of value) {
    const record = asRecord(item);
    if (record) return record;
  }
  return null;
};

const coerceStatsObject = (value: unknown): Record<string, unknown> | null => {
  const record = asRecord(value);
  if (record) return record;

  if (Array.isArray(value)) {
    const entries: Array<[string, unknown]> = [];
    for (const item of value) {
      const itemRecord = asRecord(item);
      if (!itemRecord) continue;
      const name = normalizeName(getField(itemRecord, 'name', 'stat', 'ability'));
      if (!name) continue;
      const score = getField(itemRecord, 'value', 'score', 'amount');
      entries.push([name, score]);
    }
    if (entries.length) return Object.fromEntries(entries);
  }

  return null;
};

const unwrapNpc = (value: unknown): Record<string, unknown> => {
  const fromArray = firstRecordInArray(value);
  if (fromArray) return fromArray;

  const record = asRecord(value);
  if (!record) return {};

  const wrapperKeys = ['npc', 'character', 'result', 'data'];
  for (const key of wrapperKeys) {
    const nested = getField(record, key);
    const nestedRecord = asRecord(nested) ?? firstRecordInArray(nested);
    if (nestedRecord) {
      const merged = { ...record, ...nestedRecord };
      delete (merged as Record<string, unknown>)[key];
      return merged;
    }
  }

  if (Object.keys(record).length === 1) {
    const onlyValue = Object.values(record)[0];
    const unwrapped = unwrapNpc(onlyValue);
    if (Object.keys(unwrapped).length) return unwrapped;
  }

  return record;
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

const extractStat = (stats: Record<string, unknown> | undefined, keys: string[]) => {
  if (!stats) return null;
  for (const key of keys) {
    const parsed = toInt(getField(stats, key));
    if (parsed != null) return parsed;
  }
  return null;
};

const extractStatAny = (source: Record<string, unknown>, keys: string[]) => {
  const direct = extractStat(source, keys);
  if (direct != null) return direct;
  const statsCandidate = getField(
    source,
    'stats',
    'statBlock',
    'stat_block',
    'abilities',
    'abilityScores',
    'ability_scores'
  );
  const stats = coerceStatsObject(statsCandidate);
  return extractStat(stats ?? undefined, keys);
};

const extractFlat = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const val = getField(source, key);
    const parsed = toInt(val);
    if (parsed != null) return parsed;
  }
  return null;
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

const parseGeminiJson = (text: string) => {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
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

export async function generateNpc(
  _prev: GenerateNpcState,
  formData: FormData
): Promise<GenerateNpcState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const description = (formData.get('description') as string | null)?.trim();
    if (!description) return { status: 'error', message: 'Description is required.' };

    const prompt = buildPrompt(description);
    const { text } = await generateGeminiText(prompt, {
      maxOutputTokens: 256,
      temperature: 0.6,
      responseMimeType: 'application/json',
      systemInstruction: 'Return strictly valid JSON. Do not include code fences or extra text.',
    });

    const npc = unwrapNpc(parseGeminiJson(text));

    const modelName = normalizeName(getField(npc, 'name', 'npcName', 'fullName', 'npc_name'));
    const modelTitle = normalizeName(getField(npc, 'title'));
    const modelClass = normalizeName(getField(npc, 'class', 'className', 'profession', 'job'));
    const modelDescription = normalizeName(getField(npc, 'description', 'summary', 'bio'));

    const name = modelName || 'Generated NPC';
    const title = modelTitle || modelClass || null;
    const descriptionToUse = modelDescription || description;

    const alignment = normalizeEnum(getField(npc, 'alignment', 'align'), Alignment);
    const gender = normalizeEnum(getField(npc, 'gender', 'sex'), Gender);
    const hp = extractFlat(npc, ['hp', 'hitPoints', 'hit_points', 'maxHp', 'max_hp', 'hitpoints']);
    const ac = extractFlat(npc, ['ac', 'armorClass', 'armor_class', 'armorclass']);
    const speed = extractFlat(npc, ['speed', 'speedFt', 'speed_ft']);
    const raceId = await findRaceId(getField(npc, 'race', 'raceName', 'species'));
    const classId = await findClassId(getField(npc, 'class', 'className', 'profession', 'job'));

    const statBlockData = {
      armorClass: ac ?? extractStatAny(npc, ['ac', 'armorclass', 'armor_class']),
      maxHp: hp ?? extractStatAny(npc, ['hp', 'maxhp', 'hitpoints', 'hit_points', 'max_hp']),
      speed: speed ?? extractStatAny(npc, ['speed', 'speedft', 'speed_ft']),
      strength: extractStatAny(npc, ['strength', 'str']),
      dexterity: extractStatAny(npc, ['dexterity', 'dex']),
      constitution: extractStatAny(npc, ['constitution', 'con']),
      intelligence: extractStatAny(npc, ['intelligence', 'int']),
      wisdom: extractStatAny(npc, ['wisdom', 'wis']),
      charisma: extractStatAny(npc, ['charisma', 'cha']),
    };

    const hasStatBlock = Object.values(statBlockData).some((value) => value !== null);
    const hasAnyDetails =
      modelName !== '' ||
      title != null ||
      modelDescription !== '' ||
      descriptionToUse.trim() !== '' ||
      alignment != null ||
      gender != null ||
      raceId != null ||
      classId != null ||
      hasStatBlock;

    if (!hasAnyDetails) {
      return { status: 'error', message: 'The NPC generator did not return usable data.' };
    }

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

    return { status: 'success', id: created.id, npc };
  } catch (error) {
    console.error('failed to generate npc', error);
    const message = error instanceof Error ? error.message : 'Failed to generate NPC.';
    return { status: 'error', message };
  }
}
