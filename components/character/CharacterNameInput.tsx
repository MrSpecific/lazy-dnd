import { FormInput } from '@/components/form';

export type Hints = { hint: string; value: string }[];

export const CharacterNameInput = ({
  name,
  value,
  label = 'Name',
  size,
  hints,
}: {
  name?: string;
  value?: string;
  label?: string;
  size?: RadixInputSize;
  hints?: Hints;
}) => {
  return <FormInput name={name} value={value} label={label} size={size} />;
};

const buildCharacterNamePrompt = (hints?: Hints) => {
  let prompt = 'Generate a fantasy character name.';
  if (hints && hints.length > 0) {
    const hintStrings = hints.map((h) => `${h.hint}: ${h.value}`);
    prompt += ' Here are some details to consider:\n' + hintStrings.join('\n');
  }
  return prompt;
};

export const getCharacterName = async (hints?: Hints) => {};
