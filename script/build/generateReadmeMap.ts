const URL =
  'https://commons.wikimedia.org/wiki/Special:FilePath/File:World_map_configurable.svg';

/** idea & code based on https://github.com/osm-americana/openstreetmap-americana/pull/209 */
export async function generateReadmeMap(countryCodes: Iterable<string>) {
  const svg = await fetch(URL).then((r) => r.text());

  const classes = [...countryCodes]
    .map((code) => `.${code.toLowerCase()}`)
    .join(', ');

  return svg
    .replace('</style>', `${classes} { fill: #4caf50; }</style>`)
    .replace(
      /<title>.+?<\/title>/,
      '<title>Countries with exit:carriages data</title>',
    );
}
