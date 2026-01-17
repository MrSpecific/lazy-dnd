'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { generateGeminiText } from '@/lib/gemini';
import { Alignment, Gender, type Prisma } from '@prisma/client';

export type GenerateEncounterState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; id: string }
  | { status: 'error'; message: string };

type NpcMode = 'inline' | 'separate';

const normalizeString = (value: unknown) => {
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

const unwrapEncounter = (value: unknown): Record<string, unknown> => {
  const fromArray = firstRecordInArray(value);
  if (fromArray) return fromArray;

  const record = asRecord(value);
  if (!record) return {};

  const wrapperKeys = ['encounter', 'result', 'data'];
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
    const unwrapped = unwrapEncounter(onlyValue);
    if (Object.keys(unwrapped).length) return unwrapped;
  }

  return record;
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

const normalizeEnum = <T extends Record<string, string>>(
  value: unknown,
  enumObj: T,
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

const coerceStatsObject = (value: unknown): Record<string, unknown> | null => {
  const record = asRecord(value);
  if (record) return record;

  if (Array.isArray(value)) {
    const entries: Array<[string, unknown]> = [];
    for (const item of value) {
      const itemRecord = asRecord(item);
      if (!itemRecord) continue;
      const name = normalizeString(getField(itemRecord, 'name', 'stat', 'ability'));
      if (!name) continue;
      const score = getField(itemRecord, 'value', 'score', 'amount');
      entries.push([name, score]);
    }
    if (entries.length) return Object.fromEntries(entries);
  }

  return null;
};

const extractStat = (stats: Record<string, unknown> | null, keys: string[]) => {
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
    'ability_scores',
  );
  const stats = coerceStatsObject(statsCandidate);
  return extractStat(stats, keys);
};

const normalizeNpcList = (value: unknown) => {
  const records: Record<string, unknown>[] = [];
  if (typeof value === 'string') {
    records.push({ name: value });
    return records;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === 'string') {
        records.push({ name: entry });
      } else {
        const record = asRecord(entry);
        if (record) records.push(record);
      }
    }
  } else {
    const record = asRecord(value);
    if (record) records.push(record);
  }
  return records;
};

const buildContext = (campaign: {
  name?: string | null;
  description?: string | null;
  notes?: string | null;
  dmNotes?: string | null;
}) => {
  const lines: string[] = [];
  if (campaign.name) lines.push(`Campaign name: ${campaign.name}`);
  if (campaign.description) lines.push(`Campaign description: ${campaign.description}`);
  if (campaign.notes) lines.push(`Campaign notes: ${campaign.notes}`);
  if (campaign.dmNotes) lines.push(`DM notes: ${campaign.dmNotes}`);
  if (!lines.length) return '';
  return `\nCampaign context:\n${lines.map((line) => `- ${line}`).join('\n')}\n`;
};

const buildPrompt = (params: {
  prompt: string;
  npcMode: NpcMode;
  campaign: {
    name?: string | null;
    description?: string | null;
    notes?: string | null;
    dmNotes?: string | null;
  };
}) => {
  const npcInstructions =
    params.npcMode === 'separate'
      ? `Also include an "npcs" array with objects: name, title, description, race, class, alignment, gender, hp, ac, speed, stats (strength, dexterity, constitution, intelligence, wisdom, charisma).`
      : `If you include NPCs, add brief inline stat snippets in the description (example: "Goblin warrior (12 hp, AC 14, shortsword 1d4 +2)") and do not include an "npcs" array.`;

  return `
Generate a concise D&D 5e encounter as JSON ONLY.
Include: name, description, notes, dmNotes, loot, difficulty.
${npcInstructions}
${buildContext(params.campaign)}
Use this player prompt to guide flavor: "${params.prompt}".
Respond with a single JSON object using those top-level keys only. Do not wrap in an outer object.`;
};

const findClassId = async (client: Prisma.TransactionClient, raw: unknown) => {
  const name = normalizeString(raw);
  if (!name) return null;
  const found = await client.characterClass.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
  return found?.id ?? null;
};

const findRaceId = async (client: Prisma.TransactionClient, raw: unknown) => {
  const name = normalizeString(raw);
  if (!name) return null;
  const found = await client.race.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
  return found?.id ?? null;
};

export async function generateEncounter(
  _prevState: GenerateEncounterState,
  formData: FormData,
): Promise<GenerateEncounterState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const campaignId = normalizeString(formData.get('campaignId'));
    const prompt = normalizeString(formData.get('prompt'));
    const npcModeRaw = normalizeString(formData.get('npcMode'));
    const npcMode: NpcMode = npcModeRaw === 'separate' ? 'separate' : 'inline';
    if (!campaignId) return { status: 'error', message: 'Campaign id is required.' };
    if (!prompt) return { status: 'error', message: 'Prompt is required.' };

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        OR: [{ ownerId: user.id }, { dms: { some: { id: user.id } } }],
      },
      select: {
        id: true,
        name: true,
        description: true,
        notes: true,
        dmNotes: true,
      },
    });

    if (!campaign) return { status: 'error', message: 'Campaign not found.' };

    const { text } = await generateGeminiText(
      buildPrompt({
        prompt,
        npcMode,
        campaign,
      }),
      {
        maxOutputTokens: 256,
        temperature: 0.7,
        responseMimeType: 'application/json',
        systemInstruction: 'Return strictly valid JSON. Do not include code fences or extra text.',
      },
    );

    const encounter = unwrapEncounter(parseGeminiJson(text));

    const name = normalizeString(getField(encounter, 'name', 'title')) || 'Generated Encounter';
    const description =
      normalizeString(getField(encounter, 'description', 'summary', 'hook')) || prompt;
    const notes = normalizeString(getField(encounter, 'notes', 'playerNotes', 'player_notes')) || null;
    const dmNotes =
      normalizeString(getField(encounter, 'dmNotes', 'dm_notes', 'gmNotes', 'gm_notes')) || null;
    const loot = normalizeString(getField(encounter, 'loot', 'treasure', 'rewards')) || null;
    const difficulty =
      normalizeString(getField(encounter, 'difficulty', 'challenge', 'cr', 'level')) || null;

    const npcPayload =
      npcMode === 'separate'
        ? getField(encounter, 'npcs', 'npc', 'monsters', 'enemies')
        : null;
    const npcRecords = npcMode === 'separate' ? normalizeNpcList(npcPayload) : [];

    const created = await prisma.$transaction(async (tx) => {
      const latestSession = await tx.gameSession.findFirst({
        where: { campaignId },
        orderBy: { date: 'desc' },
        select: { id: true },
      });

      const sessionId =
        latestSession?.id ??
        (
          await tx.gameSession.create({
            data: { campaignId, date: new Date() },
            select: { id: true },
          })
        ).id;

      const encounterRecord = await tx.encounter.create({
        data: {
          name,
          description,
          notes,
          dmNotes,
          loot,
          difficulty,
          sessionId,
        },
        select: { id: true },
      });

      if (npcMode === 'separate' && npcRecords.length) {
        for (const record of npcRecords) {
          const npcName = normalizeString(getField(record, 'name', 'npcName', 'title'));
          if (!npcName) continue;

          const title = normalizeString(getField(record, 'title')) || null;
          const npcDescription =
            normalizeString(getField(record, 'description', 'summary', 'bio')) || null;
          const alignment = normalizeEnum(getField(record, 'alignment', 'align'), Alignment);
          const gender = normalizeEnum(getField(record, 'gender', 'sex'), Gender);
          const raceId = await findRaceId(tx, getField(record, 'race', 'raceName', 'species'));
          const classId = await findClassId(
            tx,
            getField(record, 'class', 'className', 'profession', 'job'),
          );
          const armorClass = toInt(getField(record, 'ac', 'armorClass', 'armor_class'));
          const maxHp = toInt(getField(record, 'hp', 'hitPoints', 'hit_points', 'maxHp', 'max_hp'));
          const speed = toInt(getField(record, 'speed', 'speedFt', 'speed_ft'));

          const statBlockData = {
            armorClass,
            maxHp,
            speed,
            strength: extractStatAny(record, ['strength', 'str']),
            dexterity: extractStatAny(record, ['dexterity', 'dex']),
            constitution: extractStatAny(record, ['constitution', 'con']),
            intelligence: extractStatAny(record, ['intelligence', 'int']),
            wisdom: extractStatAny(record, ['wisdom', 'wis']),
            charisma: extractStatAny(record, ['charisma', 'cha']),
          };
          const hasStatBlock = Object.values(statBlockData).some((value) => value !== null);

          await tx.npc.create({
            data: {
              name: npcName,
              title,
              description: npcDescription,
              createdById: user.id,
              alignment,
              gender,
              raceId,
              classId,
              campaigns: { connect: { id: campaignId } },
              encounters: { connect: { id: encounterRecord.id } },
              ...(hasStatBlock && { statBlock: { create: statBlockData } }),
            },
          });
        }
      }

      return encounterRecord;
    });

    return { status: 'success', id: created.id };
  } catch (error) {
    console.error('failed to generate encounter', error);
    const message = error instanceof Error ? error.message : 'Failed to generate encounter.';
    return { status: 'error', message };
  }
}
