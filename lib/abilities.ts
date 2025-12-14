import { AbilityType } from '@prisma/client';

export const ABILITY_TYPES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;

export type AbilityCode = (typeof ABILITY_TYPES)[number];

export const abilityLabel = (ability: AbilityType | AbilityCode) => {
  switch (ability) {
    case 'STR':
      return 'Strength';
    case 'DEX':
      return 'Dexterity';
    case 'CON':
      return 'Constitution';
    case 'INT':
      return 'Intelligence';
    case 'WIS':
      return 'Wisdom';
    case 'CHA':
      return 'Charisma';
    default:
      return ability;
  }
};
