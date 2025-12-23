'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type RestType = 'short' | 'long';

type RestSignal = {
  type: RestType;
  id: number;
};

type CharacterContextValue = {
  characterId: string;
  restSignal: RestSignal | null;
  triggerRest: (type: RestType) => void;
  armorUpdateToken: number;
  notifyArmorChanged: () => void;
};

const CharacterContext = createContext<CharacterContextValue | null>(null);

export const CharacterProvider = ({
  characterId,
  children,
}: {
  characterId: string;
  children: React.ReactNode;
}) => {
  const [restSignal, setRestSignal] = useState<RestSignal | null>(null);
  const [armorUpdateToken, setArmorUpdateToken] = useState(0);

  const triggerRest = useCallback((type: RestType) => {
    setRestSignal({ type, id: Date.now() });
  }, []);

  const notifyArmorChanged = useCallback(() => {
    setArmorUpdateToken((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({
      characterId,
      restSignal,
      triggerRest,
      armorUpdateToken,
      notifyArmorChanged,
    }),
    [characterId, restSignal, triggerRest, armorUpdateToken, notifyArmorChanged]
  );

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
};

export const useCharacterContext = () => {
  const ctx = useContext(CharacterContext);
  if (!ctx) {
    throw new Error('useCharacterContext must be used within CharacterProvider');
  }
  return ctx;
};
