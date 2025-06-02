import type { OsmFeature } from 'osm-api';
import { isStation } from '../_helpers/osm.js';
import { uniq } from '../_helpers/objects.js';
import type { OsmFeatures } from './types.def.js';

/**
 * Some networks (e.g. Wien), have seperate station nodes
 * for each mode of transport (e.g. U-Bahn & S-Bahn), so we
 * need to use the `stop_area_group` relation to:
 *  - find the "main" station element
 *  - merge the names if requires
 *  - disambiguate platform numbers (E.g. U-bahn plt. 1 vs S-bahn plt. 1)
 */
export function parseStopAreaGroups(data: OsmFeatures) {
  /** map of all stop_areas to the "best" railway=station in that group */
  const stopAreaGroups = new Map<number, OsmFeature>();

  // find all stop_area_group relations first
  for (const relation of Object.values(data.relation)) {
    if (relation.tags?.public_transport === 'stop_area_group') {
      const stopAreas = relation.members
        .map((member) => data[member.type][member.ref])
        .filter((stopArea) => stopArea?.type === 'relation')
        .filter((x) => !!x);

      const allStations = stopAreas
        .flatMap((stopArea) => {
          return stopArea.members
            .map((member) => data[member.type][member.ref]!)
            .filter(isStation);
        })
        .filter(uniq);

      if (allStations.length > 1) {
        // multiple stations with data, so find the best one

        // ensure that we get a deterministic result
        const bestStation = allStations.sort((a, b) => a.id - b.id)[0]!;

        for (const member of stopAreas) {
          if (member.type === 'relation') {
            stopAreaGroups.set(member.id, bestStation);
          }
        }
      }
    }
  }

  return stopAreaGroups;
}
