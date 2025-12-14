export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { generateGeminiText } from '@/lib/gemini';

const buildPrompt = (description: string) => {
  return `
Generate a concise NPC for D&D 5e as JSON ONLY.
Include: name, gender, race, class, alignment, title, description, stats (strength,dexterity,constitution,intelligence,wisdom,charisma as integers 3-20), hp (max), ac, speed, inventory (array of strings).
Use this player-provided description to guide flavor: "${description}".
Respond with valid JSON and nothing else.`;
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

    let npc;
    try {
      npc = JSON.parse(text);
    } catch {
      npc = { raw: text };
    }

    return NextResponse.json({ npc });
  } catch (error) {
    console.error('failed to generate npc', error);
    const message = error instanceof Error ? error.message : 'Failed to generate NPC';
    return NextResponse.json({ message }, { status: 500 });
  }
}
