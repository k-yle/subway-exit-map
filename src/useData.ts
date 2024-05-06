import { useCallback, useEffect, useState } from 'react';
import type { Data } from './types.def.js';

export function useData() {
  const [data, setData] = useState<Data>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (data) console.log(data);
  }, [data]);

  const doFetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const newData = await fetch('/api').then((r) => r.json());
      setData(newData);
      localStorage.carriages = JSON.stringify(newData);
    } catch (ex) {
      console.error(ex);
      setError(ex instanceof Error ? ex : new Error(<string>ex));
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

  return <const>[data, error, isLoading, doFetch];
}
