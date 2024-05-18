import { type Dispatch, type SetStateAction, createContext } from 'react';

export const RouterContext = createContext<Dispatch<SetStateAction<string>>>(
  undefined as never,
);
