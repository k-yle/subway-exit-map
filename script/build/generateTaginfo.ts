import { join } from 'node:path';
import { evaluateStringUnion } from 'runtime-union';
import type { DateString, Schema } from 'taginfo-projects';

/** @param taginfo is mutated */
export async function generateTaginfo(taginfo: Schema) {
  const keys = evaluateStringUnion(
    join(import.meta.dirname, '../_logic/types.def.ts'),
    'Key',
  );

  taginfo.tags = keys.map((key) => ({ key }));

  taginfo.data_updated = <DateString>(
    new Date().toISOString().replaceAll(/[-:]|(\.\d+)/g, '')
  );
}
