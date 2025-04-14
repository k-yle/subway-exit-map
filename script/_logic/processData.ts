import type { Item, ItemId } from 'wikibase-sdk';
import { iso1A2Code } from '@rapideditor/country-coder';
import { isTruthy, uniq, uniqBy } from '../_helpers/objects.js';
import { P, getItemWikipedia, sortByRank } from '../_helpers/wikidata.js';
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
import { flipFunctions } from './flipping/index.js';
import { getTravellingDirection } from './getTravellingDirection.js';
import { getAllRoutes } from './getAllRoutes.js';
import { parseStopAreaGroups } from './stopAreaGroups.js';

export function processData({
  osm: osmArray,
  wikidata,
  lastUpdated,
}: RawInput): Data {
  const warnings: string[] = [];
  const stations: Station[] = [];

  // convert to an object
  const osm: OsmFeatures = { node: {}, way: {}, relation: {} };
  for (const feature of osmArray) osm[feature.type][feature.id] = feature;

  const stopAreaGroups = parseStopAreaGroups(osm);

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
        station = {
          relationId: relation.id,
          gtfsId,
          name: getNames(trainStationFeature.tags),
          fareGates:
            fareGates in FareGates ? (fareGates as FareGates) : undefined,
          fareGatesNote,
          networks: [],
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

            // assume that a stop_position node is never at a 3-way junction,
            // so we just find the first track that includes this node.
            const track = Object.values(osm.way).find((feature) =>
              feature.nodes.includes(node.id),
            );

            const routes = groupRoutesThatStopHere(routesThatStopHere, node);
            const shieldKeys = new Set(
              Object.values(routes).flat().map(getShieldKey),
            );

            const routesThatPassThroughWithoutStopping = uniqBy(
              track
                ? Object.values(osm.relation)
                    .filter(
                      (feature) =>
                        !!feature.tags?.route &&
                        // check that it's not already in routesThatStopHere
                        !routesThatStopHere.some((r) => r.id === feature.id) &&
                        feature.members.some(
                          (m) => m.type === 'way' && m.ref === track.id,
                        ),
                    )
                    .map((r) => {
                      const shield = getRouteShield(r.tags!);
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
              if (!track) continue;

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
                track,
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

            station.stops.push({
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

              // typecast is a hack, we fix this later
              lastStop: <never[]>[...lastStops],
              nextStop: <never[]>[...nextStops],
            });
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
      stop.lastStop = stop.lastStop
        .map((id) => nIdToObject(<never>id, station.networks))
        .filter(isTruthy);
      stop.nextStop = stop.nextStop
        .map((id) => nIdToObject(<never>id, station.networks))
        .filter(isTruthy);
    }

    const stopsArray = station.stops;
    // nothing to flip at stations with only 1 platform
    if (stopsArray.length > 1) {
      // try several different algorithms to figure out
      // which stops (if any) should be flipped
      for (const f of flipFunctions) {
        const stopsToFlip = f(stopsArray, osm, station, warnings);
        if (stopsToFlip) {
          station.flipAlgorithm = f.name;
          for (const [index, stop] of stopsArray.entries()) {
            stop.flip = stopsToFlip[index];
          }
          break;
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
        ? `http://commons.wikimedia.org/wiki/Special:FilePath/${bestLogo}`
        : fbUsername
          ? `https://graph.facebook.com/${fbUsername}/picture?type=large`
          : undefined;

      const geoCoords =
        item.claims[P.GeoCoordinates]?.sort(sortByRank)[0]?.mainsnak.datavalue;

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
      };
    });

  const { routes, nodesWithNoData } = getAllRoutes(
    osm,
    wikidata,
    stationsByStopId,
  );

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
