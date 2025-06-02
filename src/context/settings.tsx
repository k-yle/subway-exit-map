import {
  type PropsWithChildren,
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Settings } from '../types.def';
import { LOCAL_STORAGE_KEYS } from '../helpers/const';

export const SettingsContext = createContext<{
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}>(undefined as never);
SettingsContext.displayName = 'SettingsContext';

export const SettingsWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      return JSON.parse(localStorage[LOCAL_STORAGE_KEYS.settings]);
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage[LOCAL_STORAGE_KEYS.settings] = JSON.stringify(settings);
  }, [settings]);

  const context = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <SettingsContext.Provider value={context}>
      {children}
    </SettingsContext.Provider>
  );
};
