import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import taginfo from '../taginfo.template.json';
import { fetchData } from './_logic/fetchData.js';
import { processData } from './_logic/processData.js';
import { generateReadmeMap } from './build/generateReadmeMap';
import { isTruthy } from './_helpers/objects';
import { generateTaginfo } from './build/generateTaginfo';

const outFolder = join(import.meta.dirname, '../public/data');

async function main() {
  const input = await fetchData(taginfo.project.project_url);

  console.time('main');
  const toClient = processData(input);
  console.timeEnd('main');

  // just for the README
  const countryCodes = new Set(
    toClient.networks.map((n) => n.country).filter(isTruthy),
  );
  const svgMap = await generateReadmeMap(countryCodes);
  await generateTaginfo(taginfo);

  await fs.mkdir(outFolder, { recursive: true });
  await fs.writeFile(
    join(outFolder, 'api.json'),
    JSON.stringify(toClient, null, 2),
  );
  await fs.writeFile(join(outFolder, 'map.svg'), svgMap);
  await fs.writeFile(
    join(outFolder, 'taginfo.generated.json'),
    JSON.stringify(taginfo, null, 2),
  );
}

main();
