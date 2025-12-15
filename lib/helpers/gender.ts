import { Gender } from '@prisma/client';

export type GenderKey = Gender;

export type GenderInfo = {
  label: string;
  color: RadixColor;
};

const MASC_COLOR: RadixColor = 'green';
const FEMME_COLOR: RadixColor = 'grass';
const NEUTRAL_COLOR: RadixColor = 'amber';
const OTHER_COLOR: RadixColor = 'gray';

export const genderMeta: Record<GenderKey, GenderInfo> = {
  MALE: { label: 'Male', color: MASC_COLOR },
  FEMALE: { label: 'Female', color: FEMME_COLOR },
  NON_BINARY: { label: 'Non-binary', color: NEUTRAL_COLOR },
  OTHER: { label: 'Other', color: OTHER_COLOR },
};

export const getGenderMeta = (gender: Gender | null | undefined) =>
  gender ? genderMeta[gender] : undefined;
