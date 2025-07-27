import { DEST_DELIMITER } from '../components/PlatformName';
import { getName } from '../i18n';
import type { Data, RouteThatStopsHere } from '../types.def';

/** FIXME: this should really be done on the BE..., and reduce duplication in the JSON */
export function getLocalisedRouteTags(
  data: Data,
  firstRoute: RouteThatStopsHere,
) {
  return firstRoute.to?.map((name) => {
    const rawName = name.split(DEST_DELIMITER)[0]!;

    for (const osmId of firstRoute.osmId) {
      const lastStationId = firstRoute.qId
        .map((qId) => data.routes[qId])
        .find(Boolean)
        ?.[firstRoute.shieldKey]?.variants?.[osmId]?.stops.at(
          -1,
        )?.stationRelation;

      const lastStation = data.stations.find(
        (s) => s.relationId === lastStationId,
      );

      // check if the route's `to` tag matches any of the `name:*` tags from
      // the terminus. If yes, we can use the multilingual names from the terminus.
      const anyMatches = Object.values(lastStation?.name || {}).includes(
        rawName,
      );

      const localisedName = lastStation && getName(lastStation.name);
      if (localisedName && anyMatches) return localisedName;
    }

    // none of the routes matched
    return rawName;
  });
}
