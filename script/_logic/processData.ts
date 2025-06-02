import type { Item, ItemId } from 'wikibase-sdk';
import { iso1A2Code } from '@rapideditor/country-coder';
import { isTruthy, take, uniq, uniqBy } from '../_helpers/objects.js';
import {
  P,
  Q,
  equalsQId,
  getItemWikipedia,
  sortByRank,
} from '../_helpers/wikidata.js';
import { ICONS, getNetworks } from '../_helpers/override.js';
import { getShieldKey } from '../_helpers/hash.js';
import { getLocalRef, getNames, getRef, isStation } from '../_helpers/osm.js';
import {
  type AdjacentStop,
  type Data,
  FareGates,
  type MultiLingualNames,
  type OsmFeatures,
  type RawInput,
  type Station,
  type Stop,
} from './types.def.js';
import { createExitMap } from './createExitMap.js';
import {
  getRouteShield,
  groupRoutesThatStopHere,
} from './groupRoutesThatStopHere.js';
import { getTravellingDirection } from './getTravellingDirection.js';
import { getAllRoutes } from './getAllRoutes.js';
import { parseStopAreaGroups } from './stopAreaGroups.js';
import { flipByTrackDirection } from './flipping/flipByTrackDirection.js';
import { getRouteShapes } from './getRouteShapes.js';

export function processData({
  osm: osmArray,
  wikidata,
  lastUpdated,
}: RawInput): Data {
  const warnings: string[] = [];
  const stations: Station[] = [];
  const stopLinkage = new Map<
    Stop,
    { lastStops: Set<number>; nextStops: Set<number> }
  >();

  // convert to an object
  const osm: OsmFeatures = { node: {}, way: {}, relation: {} };
  for (const feature of osmArray) osm[feature.type][feature.id] = feature;

  const stopAreaGroups = parseStopAreaGroups(osm);

  const routeShapes = getRouteShapes(wikidata);

  const networksWithStationCodes = new Set(
    Object.values(wikidata)
      .filter((item) =>
        (<Item>item).claims?.[P.Uses]?.some(
          (claim) =>
            equalsQId(claim.mainsnak.datavalue, Q.AlphanumericCode) &&
            claim.qualifiers?.[P.AppliesToPart]?.some((part) =>
              equalsQId(part.datavalue, Q.Station),
            ),
        ),
      )
      .map((item) => item.id),
  );

  // find all stop_area relations first
  for (const relation of Object.values(osm.relation)) {
    if (relation.tags?.public_transport === 'stop_area') {
      const trainStationFromGroup = stopAreaGroups.get(relation.id);
      const trainStationFromOwn = relation.members
        .map((member) => osm[member.type][member.ref])
        .find(isStation);

      const trainStationFeature = trainStationFromGroup || trainStationFromOwn;

      if (!trainStationFeature?.tags) {
        warnings.push(`No station found for ${relation.id}`);
        continue;
      }

      const gtfsId =
        getRef(trainStationFeature.tags) || `_${trainStationFeature.id}`;

      let station = stations.find((s) => s.gtfsId === gtfsId);
      if (!station) {
        const fareGates = trainStationFeature.tags.fare_gates;
        const fareGatesNote = trainStationFeature.tags['fare_gates:note'];

        const stationQIds = getNetworks(trainStationFeature.tags);

        const refs = trainStationFeature.tags.ref?.split(';');
        const refColours = trainStationFeature.tags['ref:colour']?.split(';');

        station = {
          relationId: relation.id,
          gtfsId,
          name: getNames(trainStationFeature.tags),
          fareGates:
            fareGates && fareGates in FareGates
              ? (fareGates as FareGates)
              : undefined,
          fareGatesNote,
          icon:
            networksWithStationCodes.intersection(new Set(stationQIds)).size &&
            refs &&
            refColours
              ? refs.map((value, index) => ({
                  value,
                  colour: refColours[index],
                }))
              : undefined,

          networks: stationQIds, // the network tag from all routes is also added later
          stops: [],
        };
        stations.push(station);
      }

      for (const member of relation.members) {
        if (member.type === 'node' && member.role.startsWith('stop')) {
          const node = osm[member.type][member.ref];

          if (node) {
            const ownLocalRef = getLocalRef(node.tags, station.networks);

            // find a platform in the same stop_area with a matching local_ref
            const platformFeature = relation.members
              .filter((m) => m.role === 'platform')
              .map((m) => osm[m.type][m.ref])
              .find(
                (feature) =>
                  ownLocalRef &&
                  ownLocalRef === getLocalRef(feature?.tags, station.networks),
              );

            const routesThatStopHere = Object.values(osm.relation).filter(
              (feature) =>
                !!feature.tags?.route &&
                feature.members.some(
                  (m) =>
                    m.type === 'node' &&
                    m.role.startsWith('stop') &&
                    m.ref === node.id,
                ),
            );

            /**
             * A stop_position node could be at a vertex where two tracks join,
             * or even at a 3-way junction (although this is very unlikely).
             * In any case, we need to find every track that includes this node.
             */
            const trackIds = new Set(
              Object.values(osm.way)
                .filter((feature) => feature.nodes.includes(node.id))
                .map((w) => w.id),
            );

            const routes = groupRoutesThatStopHere(
              routesThatStopHere,
              node,
              routeShapes,
            );
            const shieldKeys = new Set(
              Object.values(routes).flat().map(getShieldKey),
            );

            const routesThatPassThroughWithoutStopping = uniqBy(
              trackIds.size
                ? Object.values(osm.relation)
                    .filter(
                      (feature) =>
                        !!feature.tags?.route &&
                        // check that it's not already in routesThatStopHere
                        !routesThatStopHere.some((r) => r.id === feature.id) &&
                        feature.members.some(
                          (m) => m.type === 'way' && trackIds.has(m.ref),
                        ),
                    )
                    .map((r) => {
                      const shield = getRouteShield(r.tags!, routeShapes);
                      const key = getShieldKey(shield);
                      if (shieldKeys.has(key)) {
                        // if this non-stopping route has exactly the same ref
                        // as a route that stops, then we need to disambiguate
                        // them using the destination
                        const { to, from } = r.tags!;
                        return {
                          ...shield,
                          isDuplicate:
                            !to || !from ? {} : routes[to] ? { from } : { to },
                        };
                      }
                      // there is no route that stops here with the same shield
                      return shield;
                    })
                    .sort((a, b) => (a.ref || '').localeCompare(b.ref || ''))
                : [],
              JSON.stringify,
            );

            // the OSM nodeId
            const lastStops = new Set<number>();
            const nextStops = new Set<number>();

            for (const route of routesThatStopHere) {
              const wayMembers = new Set(
                route.members.filter((m) => m.type === 'way').map((m) => m.ref),
              );

              // if the stopping location is the vertex between two tracks,
              // there could be multiple tracks, but only one is in the route
              // relation. So find the first track which is actually in the relation.
              const trackId = take(trackIds.intersection(wayMembers));

              if (!trackId) {
                warnings.push(
                  `r${route.id} includes n${node.id}, but not that node's track/s (w${[...trackIds]})`,
                );
                continue;
              }

              for (const network of getNetworks(route.tags!)) {
                if (!station.networks.includes(network)) {
                  station.networks.push(network);
                }
              }

              const stopsOnThisRoute = route.members
                .filter((m) => m.type === 'node' && m.role.startsWith('stop'))
                .map((m) => m.ref);
              const indexOfOurStop = stopsOnThisRoute.indexOf(node.id);

              const lastStopId = stopsOnThisRoute[indexOfOurStop - 1] || -1;
              const nextStopId = stopsOnThisRoute[indexOfOurStop + 1] || -1;
              let lastStop = osm.node[lastStopId];
              let nextStop = osm.node[nextStopId];

              const travellingDirectionAlongTrack = getTravellingDirection(
                route,
                osm.way[trackId]!,
                osm,
                warnings,
              );

              if (travellingDirectionAlongTrack === 'backward') {
                [lastStop, nextStop] = [nextStop, lastStop];
              }

              if (lastStop?.tags) {
                lastStops.add(lastStop.id);
              }
              if (nextStop?.tags) {
                nextStops.add(nextStop.id);
              }
            }

            const stop: Stop = {
              nodeId: node.id,
              gtfsId: node.tags?.ref || `${node.id}`,
              platform: getLocalRef(node.tags, station.networks),
              description:
                (node.tags?.description?.length ?? 99) < 20
                  ? node.tags!.description
                  : undefined,
              inaccessible:
                node.tags?.wheelchair === 'no' ||
                platformFeature?.tags?.wheelchair === 'no',
              lat: node.lat,
              lon: node.lon,
              ...createExitMap(node, osm),
              lastUpdate: {
                date: node.timestamp,
                user: node.user,
              },
              routes,
              passThroughRoutes: routesThatPassThroughWithoutStopping.length
                ? routesThatPassThroughWithoutStopping
                : undefined,

              // if the station came from the group, each stop needs to use the correct name
              ...(trainStationFromGroup && {
                disambiguationName: getNames(trainStationFromOwn?.tags),
              }),

              lastStop: [],
              nextStop: [],
            };
            station.stops.push(stop);
            stopLinkage.set(stop, { lastStops, nextStops });
          } else {
            // we haven't downloaded this node
            // because no routes (from our network) stop here
          }
        }
      }

      // sort the platforms in a way that handles number, letters,
      // a mix of numbers+letters (e.g. 14A), or names (e.g. NYC).
      const getPlatform = (stop: Stop) =>
        stop.platform || stop.description || '';

      let longestPlatform = 0;
      for (const stop of station.stops) {
        longestPlatform = Math.max(longestPlatform, getPlatform(stop).length);
      }

      const getSortKey = (stop: Stop) => {
        const prefix = stop.disambiguationName?.[''];
        const platform = getPlatform(stop).padStart(longestPlatform, '0');
        return prefix + platform;
      };

      station.stops.sort((stopA, stopB) => {
        return getSortKey(stopA).localeCompare(getSortKey(stopB));
      });
    }
  }

  const stationsByStopId: Record<number, [Station, Stop]> = {};
  for (const station of stations) {
    for (const stop of station.stops) {
      stationsByStopId[stop.nodeId] = [station, stop];
    }
  }

  // convert the next/last stop from number[] to the proper type
  const nIdToObject = (
    stopNodeId: number,
    networks: ItemId[],
  ): AdjacentStop | undefined => {
    const [station, stop] = stationsByStopId[stopNodeId] || [];

    if (!station || !stop) {
      // the next stop doesn't have exit:carriages data, but we
      // might be able to find it in the raw OSM data
      const maybeStop = osm.node[stopNodeId];
      if (maybeStop) {
        return {
          gtfsId: undefined,
          nodeId: stopNodeId,
          platform: getLocalRef(maybeStop.tags, networks),
          stationName: getNames(maybeStop.tags),
        };
      }

      return undefined;
    }

    return {
      gtfsId: station.gtfsId,
      nodeId: stopNodeId,
      stationName: station.name,
      platform: stop.platform,
    };
  };
  for (const station of stations) {
    for (const stop of station.stops) {
      const { lastStops, nextStops } = stopLinkage.get(stop)!;
      stop.lastStop = [...lastStops]
        .map((id) => nIdToObject(id, station.networks))
        .filter(isTruthy);
      stop.nextStop = [...nextStops]
        .map((id) => nIdToObject(id, station.networks))
        .filter(isTruthy);
    }

    const stopsArray = station.stops;
    // nothing to flip at stations with only 1 platform
    if (stopsArray.length > 1) {
      // figure out
      // which stops (if any) should be flipped
      const stopsToFlip = flipByTrackDirection(stopsArray, osm);
      if (stopsToFlip) {
        for (const [index, stop] of stopsArray.entries()) {
          stop.flip = stopsToFlip[index];
        }
      }
    }
  }

  const networkMetadata: Data['networks'] = stations
    .flatMap((station) => station.networks)
    .filter(uniq)
    .map((qId): Data['networks'][0] => {
      const item = <Item>wikidata[qId];
      if (!item?.claims) {
        throw new Error(`No wikidata info for ${qId}`);
      }

      const bestLogo = (item.claims[P.Logo1] || item.claims[P.Logo2])
        ?.filter((claim) => claim.mainsnak.datatype === 'commonsMedia')
        .sort(sortByRank)[0]?.mainsnak.datavalue?.value;

      const country = (
        item.claims[P.Country]?.find(
          (claim) => claim.mainsnak.datatype === 'wikibase-item',
        )?.mainsnak.datavalue?.value as { id: string } | undefined
      )?.id;

      const fbUsername =
        item.claims[P.FacebookUsername]?.sort(sortByRank)[0]?.mainsnak.datavalue
          ?.value;

      const logoUrl = bestLogo
        ? `https://commons.wikimedia.org/wiki/Special:FilePath/${bestLogo}`
        : fbUsername
          ? `https://graph.facebook.com/${fbUsername}/picture?type=large`
          : undefined;

      const geoCoords =
        item.claims[P.GeoCoordinates]?.sort(sortByRank)[0]?.mainsnak.datavalue;

      const PlatformScreenDoor = item.claims[P.Uses]?.find(
        (claim) =>
          claim.mainsnak.datatype === 'wikibase-item' &&
          equalsQId(claim.mainsnak.datavalue, Q.PlatformScreenDoor),
      );
      const hasDoorNumbers = PlatformScreenDoor?.qualifiers?.[P.Uses]?.some(
        (qualifier) =>
          qualifier.datatype === 'wikibase-item' &&
          equalsQId(qualifier.datavalue, Q.NumericalDigit),
      );
      const firstDoorNumber = +(
        PlatformScreenDoor?.qualifiers?.[P.FirstNumber]?.[0]?.datavalue
          ?.value || 1
      );

      const names: MultiLingualNames = {};
      for (const lang in item.labels) {
        const value = item.labels[lang]?.value;
        if (value) names[lang] = value;
      }
      return {
        qId,
        name: names,
        wikipedia: getItemWikipedia(item),
        logoUrl,
        country: (country && iso1A2Code(country)) || undefined,
        centre:
          geoCoords?.type === 'globecoordinate'
            ? { lat: geoCoords.value.latitude, lon: geoCoords.value.longitude }
            : { lat: -1, lon: -1 },
        doorNumbers: hasDoorNumbers ? firstDoorNumber : undefined,
      };
    });

  const { routes, nodesWithNoData } = getAllRoutes(
    osm,
    wikidata,
    stationsByStopId,
    routeShapes,
  );

  for (const warning of warnings) console.warn('(!)', warning);

  return {
    warnings,
    stations,
    networks: networkMetadata,
    routes,
    nodesWithNoData,
    supportedSymbols: ICONS,
    lastGenerated: new Date().toISOString(),
    lastUpdated,
  };
}
