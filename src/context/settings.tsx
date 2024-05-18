import {
  type PropsWithChildren,
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Settings } from '../types.def';

const KEY = 'carriageSettings';

export const SettingsContext = createContext<{
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}>(undefined as never);

export const SettingsWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      return JSON.parse(localStorage[KEY]);
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.carriageSettings = JSON.stringify(settings);
  }, [settings]);

  const context = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <SettingsContext.Provider value={context}>
      {children}
    </SettingsContext.Provider>
  );
};
