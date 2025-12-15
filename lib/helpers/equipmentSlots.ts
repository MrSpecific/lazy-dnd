import { EquipmentSlot } from '@prisma/client';

export type SlotMeta = {
  label: string;
  description: string;
  forWeapons: boolean;
  forArmor: boolean;
};

export const slotMeta: { [key in EquipmentSlot]: SlotMeta } = {
  HEAD: {
    label: 'Head',
    description: 'Items worn on the head, such as helmets or hats.',
    forWeapons: false,
    forArmor: true,
  },
  NECK: {
    label: 'Neck',
    description: 'Items worn around the neck, such as amulets or necklaces.',
    forWeapons: false,
    forArmor: true,
  },
  CHEST: {
    label: 'Chest',
    description: 'Items worn on the torso, such as armor or robes.',
    forWeapons: false,
    forArmor: true,
  },
  HANDS: {
    label: 'Hands',
    description: 'Items worn on the hands, such as gloves or gauntlets.',
    forWeapons: false,
    forArmor: true,
  },
  FINGER: {
    label: 'Finger',
    description: 'Items worn on the fingers, such as rings.',
    forWeapons: false,
    forArmor: true,
  },
  MAIN_HAND: {
    label: 'Main hand',
    description: 'Items held in the main hand, such as weapons or shields.',
    forWeapons: true,
    forArmor: false,
  },
  OFF_HAND: {
    label: 'Off hand',
    description: 'Items held in the off hand, such as secondary weapons or shields.',
    forWeapons: true,
    forArmor: false,
  },
  TWO_HANDED: {
    label: 'Two handed',
    description: 'Items that require both hands to use, such as greatswords or staves.',
    forWeapons: true,
    forArmor: false,
  },
  FEET: {
    label: 'Feet',
    description: 'Items worn on the feet, such as boots or greaves.',
    forWeapons: false,
    forArmor: true,
  },
  BACK: {
    label: 'Back',
    description: 'Items worn on the back, such as cloaks or backpacks.',
    forWeapons: false,
    forArmor: true,
  },
  OTHER: {
    label: 'Other',
    description: 'Slots that do not fit into other categories.',
    forWeapons: true,
    forArmor: true,
  },
};

export const slotOptions = Object.keys(slotMeta).map((slot) => ({
  value: slot as EquipmentSlot,
  label: slotMeta[slot as EquipmentSlot].label,
}));

export const weaponSlotOptions = slotOptions.filter((option) => {
  return slotMeta[option.value].forWeapons;
});

export const armorSlotOptions = slotOptions.filter((option) => {
  return slotMeta[option.value].forArmor;
});
