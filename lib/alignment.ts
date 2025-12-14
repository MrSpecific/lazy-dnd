'use client';

import { Alignment } from '@prisma/client';

export type AlignmentKey = Alignment;

export type AlignmentInfo = {
  label: string;
  color: RadixColor;
};

const GOOD_COLOR: RadixColor = 'grass';
const NEUTRAL_COLOR: RadixColor = 'amber';
const EVIL_COLOR: RadixColor = 'crimson';

export const alignmentMeta: Record<AlignmentKey, AlignmentInfo> = {
  LAWFUL_GOOD: { label: 'Lawful Good', color: GOOD_COLOR },
  NEUTRAL_GOOD: { label: 'Neutral Good', color: GOOD_COLOR },
  CHAOTIC_GOOD: { label: 'Chaotic Good', color: GOOD_COLOR },

  LAWFUL_NEUTRAL: { label: 'Lawful Neutral', color: NEUTRAL_COLOR },
  TRUE_NEUTRAL: { label: 'True Neutral', color: NEUTRAL_COLOR },
  CHAOTIC_NEUTRAL: { label: 'Chaotic Neutral', color: NEUTRAL_COLOR },

  LAWFUL_EVIL: { label: 'Lawful Evil', color: EVIL_COLOR },
  NEUTRAL_EVIL: { label: 'Neutral Evil', color: EVIL_COLOR },
  CHAOTIC_EVIL: { label: 'Chaotic Evil', color: EVIL_COLOR },
};

export const getAlignmentMeta = (alignment: Alignment | null | undefined) =>
  alignment ? alignmentMeta[alignment] : undefined;
