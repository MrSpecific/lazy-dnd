export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiText } from '@/lib/gemini';
import { stackServerApp } from '@/stack/server';

type Hint = { hint: string; value: string };

const buildCharacterNamePrompt = (hints?: Hint[]) => {
  let prompt = 'Generate a concise fantasy RPG character name that fits the given details.';
  if (hints && hints.length > 0) {
    const hintStrings = hints.map((h) => `- ${h.hint}: ${h.value}`);
    prompt += ' Consider these details:\n' + hintStrings.join('\n');
  }
  prompt += '\nReturn only the name with no punctuation or explanations.';
  return prompt;
};

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { hints?: Hint[] };
    const prompt = buildCharacterNamePrompt(body.hints);

    const { text } = await generateGeminiText(prompt, {
      maxOutputTokens: 24,
      temperature: 0.8,
    });

    const name = text.split('\n')[0]?.trim() ?? '';

    return NextResponse.json({ name });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('failed to generate character name', error);
    return NextResponse.json({ message: 'Failed to generate character name', error: message }, { status: 500 });
  }
}
