'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { generateGeminiText } from '@/lib/gemini';

export type GenerateEncounterState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; id: string }
  | { status: 'error'; message: string };

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

const buildPrompt = (prompt: string) => `
Generate a concise D&D 5e encounter as JSON ONLY.
Include: name, description, notes, dmNotes, loot, difficulty.
Use this player prompt to guide flavor: "${prompt}".
Respond with a single JSON object using those top-level keys only. Do not wrap in an outer object.`;

export async function generateEncounter(
  _prevState: GenerateEncounterState,
  formData: FormData,
): Promise<GenerateEncounterState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const campaignId = normalizeString(formData.get('campaignId'));
    const prompt = normalizeString(formData.get('prompt'));
    if (!campaignId) return { status: 'error', message: 'Campaign id is required.' };
    if (!prompt) return { status: 'error', message: 'Prompt is required.' };

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        OR: [{ ownerId: user.id }, { dms: { some: { id: user.id } } }],
      },
      select: { id: true },
    });

    if (!campaign) return { status: 'error', message: 'Campaign not found.' };

    const { text } = await generateGeminiText(buildPrompt(prompt), {
      maxOutputTokens: 256,
      temperature: 0.7,
      responseMimeType: 'application/json',
      systemInstruction: 'Return strictly valid JSON. Do not include code fences or extra text.',
    });

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

    const latestSession = await prisma.gameSession.findFirst({
      where: { campaignId },
      orderBy: { date: 'desc' },
      select: { id: true },
    });

    const sessionId =
      latestSession?.id ??
      (
        await prisma.gameSession.create({
          data: { campaignId, date: new Date() },
          select: { id: true },
        })
      ).id;

    const created = await prisma.encounter.create({
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

    return { status: 'success', id: created.id };
  } catch (error) {
    console.error('failed to generate encounter', error);
    const message = error instanceof Error ? error.message : 'Failed to generate encounter.';
    return { status: 'error', message };
  }
}
