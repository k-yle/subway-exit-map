import { join } from 'node:path';
import { evaluateStringUnion } from 'runtime-union';
import type TagInfoFile from '../../taginfo.template.json';

/** @param taginfo is mutated */
export async function generateTaginfo(taginfo: typeof TagInfoFile) {
  const keys = evaluateStringUnion(
    join(import.meta.dirname, '../_logic/types.def.ts'),
    'Key',
  );

  taginfo.tags = keys.map((key) => ({ key }));

  taginfo.data_updated = new Date()
    .toISOString()
    .replaceAll(/[-:]|(\.\d+)/g, '');
}
