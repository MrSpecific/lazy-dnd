import 'server-only';

// Accept any model string to keep us forward-compatible with API naming changes.
type GeminiModel = string;

type GenerateTextOptions = {
  model?: GeminiModel;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  signal?: AbortSignal;
};

type GenerateTextResult = {
  text: string;
  raw: unknown;
};

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL: GeminiModel = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.5-flash-lite';

const getApiKey = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Gemini API key (set GOOGLE_GEMINI_API_KEY or GEMINI_API_KEY).');
  }

  return apiKey;
};

export async function generateGeminiText(
  prompt: string,
  {
    model = DEFAULT_MODEL,
    temperature,
    topP,
    topK,
    maxOutputTokens,
    systemInstruction,
    signal,
  }: GenerateTextOptions = {}
): Promise<GenerateTextResult> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };

  if (systemInstruction) {
    body.system_instruction = { role: 'system', parts: [{ text: systemInstruction }] };
  }

  const generationConfig = {
    temperature,
    topP,
    topK,
    maxOutputTokens,
  };

  if (Object.values(generationConfig).some((value) => value !== undefined)) {
    body.generationConfig = generationConfig;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'lazy-dnd/1.0 (gemini-helper)',
    },
    signal,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await safeReadText(response);
    throw new Error(`Gemini request failed (${response.status}): ${errorText}`);
  }

  const json = (await response.json()) as any;
  const text = extractText(json);

  return { text, raw: json };
}

const extractText = (payload: any): string => {
  const candidate = payload?.candidates?.[0];
  const parts = candidate?.content?.parts;
  if (!parts) return '';

  return parts
    .map((part: any) => {
      if (typeof part?.text === 'string') return part.text;
      return '';
    })
    .join('')
    .trim();
};

const safeReadText = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return '<no body>';
  }
};
