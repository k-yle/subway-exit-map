import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import type { Data } from '../types.def.js';
import { getName, t } from '../i18n.js';

const dataUrl =
  window.location.hostname === 'localhost'
    ? '/data/api.json'
    : 'https://kyle.kiwi/subway-exit-map/api.json';

export const DataContext = createContext<Data>(undefined as never);
DataContext.displayName = 'DataContext';

export const DataWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const [data, setData] = useState<Data>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (data) console.log(data);
  }, [data]);

  const doFetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const newData: Data = await fetch(dataUrl).then((r) => r.json());

      // sorting has to happen on the client side, since it depends
      // on the user's locale
      newData.stations = newData.stations.sort((a, b) =>
        (getName(a.name) || '').localeCompare(getName(b.name) || ''),
      );
      newData.networks = newData.networks.sort((a, b) =>
        (getName(a.name) || '').localeCompare(getName(b.name) || ''),
      );

      setData(newData);
      localStorage.carriages = JSON.stringify(newData);
    } catch (ex) {
      console.error(ex);
      setError(ex instanceof Error ? ex : new Error(ex as string));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    try {
      setData(JSON.parse(localStorage.carriages));
    } catch {
      // no problem, we will fetch it anyway
    }
    doFetch();
  }, [doFetch]);

  if (error) return <>{t('error.load')}</>;
  if (!data || isLoading) return <>{t('generic.loading')}</>;

  console.log('data', data);

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
};
