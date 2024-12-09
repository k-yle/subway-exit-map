import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import type { Data } from '../types.def.js';
import { t } from '../i18n.js';

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
      const newData = await fetch('/api?extended=true').then((r) => r.json());
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
