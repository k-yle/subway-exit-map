import type { OsmNode, OsmRelation, OsmWay } from 'osm-api';
import type { Item, Site } from 'wikibase-sdk';
import { isTruthy, uniq, uniqBy } from '../_helpers/objects.js';
import { sortByRank } from '../_helpers/wikidata.js';
import { ICONS, getNetwork } from '../_helpers/override.js';
import { getShieldKey } from '../_helpers/hash.js';
import {
  cleanName,
  findMember,
  getName,
  getRef,
  isStation,
} from '../_helpers/osm.js';
import {
  type AdjacentStop,
  type Data,
  FareGates,
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

export async function processData(
  { osm: data, wikidata, lastUpdated }: RawInput,
  languages: string[],
  API_BASE_URL: string,
): Promise<{
  imageUrls: Record<string, string>;
  toClient: Data;
}> {
  const warnings: string[] = [];
  const stations: Station[] = [];

  const stopAreaGroups = parseStopAreaGroups(data);

  // find all stop_area relations first
  for (const relation of data) {
    if (
      relation.type === 'relation' &&
      relation.tags?.public_transport === 'stop_area'
    ) {
      const trainStationFromGroup = stopAreaGroups.get(relation.id);
      const trainStationFromOwn = relation.members
        .map(findMember(data))
        .map(isStation)
        .find(Boolean);

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
          name: getName(trainStationFeature.tags, languages)!,
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
          const node = data.find(
            (feature): feature is OsmNode =>
              feature.type === 'node' && feature.id === member.ref,
          );

          if (node) {
            // find a platform in the same stop_area with a matching local_ref
            const platformFeature = relation.members
              .filter((m) => m.role === 'platform')
              .map((m) => data.find((d) => d.type === m.type && d.id === m.ref))
              .find(
                (feature) =>
                  node.tags?.local_ref &&
                  node.tags?.local_ref === feature?.tags?.local_ref,
              );

            const routesThatStopHere = data.filter(
              (feature): feature is OsmRelation =>
                feature.type === 'relation' &&
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
            const track = data.find(
              (feature): feature is OsmWay =>
                feature.type === 'way' && feature.nodes.includes(node.id),
            );

            const routes = await groupRoutesThatStopHere(
              routesThatStopHere,
              node,
            );
            const shieldKeys = new Set(
              Object.values(routes).flat().map(getShieldKey),
            );

            const routesThatPassThroughWithoutStopping = uniqBy(
              track
                ? data
                    .filter(
                      (feature): feature is OsmRelation =>
                        feature.type === 'relation' &&
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
              const network = getNetwork(route.tags!);

              if (network && !station.networks.includes(network)) {
                station.networks.push(network);
              }

              const stopsOnThisRoute = route.members
                .filter((m) => m.type === 'node' && m.role.startsWith('stop'))
                .map((m) => m.ref);
              const indexOfOurStop = stopsOnThisRoute.indexOf(node.id);

              const lastStopId = stopsOnThisRoute[indexOfOurStop - 1] || -1;
              const nextStopId = stopsOnThisRoute[indexOfOurStop + 1] || -1;
              let lastStop = data.find(
                (f) => f.type === 'node' && f.id === lastStopId,
              );
              let nextStop = data.find(
                (f) => f.type === 'node' && f.id === nextStopId,
              );

              const travellingDirectionAlongTrack = getTravellingDirection(
                route,
                track,
                data,
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
              platform: node.tags?.local_ref,
              description:
                (node.tags?.description?.length ?? 99) < 20
                  ? node.tags!.description
                  : undefined,
              inaccessible:
                node.tags?.wheelchair === 'no' ||
                platformFeature?.tags?.wheelchair === 'no',
              lat: node.lat,
              lon: node.lon,
              ...createExitMap(node, data),
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
                disambiguationName: getName(
                  trainStationFromOwn?.tags,
                  languages,
                ),
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

      station.stops.sort((stopA, stopB) => {
        const a =
          stopA.disambiguationName +
          getPlatform(stopA).padStart(longestPlatform, '0');
        const b =
          stopB.disambiguationName +
          getPlatform(stopB).padStart(longestPlatform, '0');
        return a.localeCompare(b);
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
  const nIdToObject = (stopNodeId: number): AdjacentStop | undefined => {
    const [station, stop] = stationsByStopId[stopNodeId] || [];

    if (!station || !stop) {
      // the next stop doesn't have exit:carriages data, but we
      // might be able to find it in the raw OSM data
      const maybeStop = data.find(
        (n) =>
          n.type === 'node' &&
          n.id === stopNodeId &&
          getName(n.tags, languages),
      );
      if (maybeStop) {
        return {
          gtfsId: undefined,
          platform: maybeStop.tags!.local_ref,
          stationName: cleanName(getName(maybeStop.tags, languages)),
        };
      }

      return undefined;
    }

    return {
      gtfsId: station.gtfsId,
      stationName: station.name,
      platform: stop.platform,
    };
  };
  for (const station of stations) {
    for (const stop of station.stops) {
      stop.lastStop = stop.lastStop
        .map((id) => nIdToObject(<never>id))
        .filter(isTruthy);
      stop.nextStop = stop.nextStop
        .map((id) => nIdToObject(<never>id))
        .filter(isTruthy);
    }

    const stopsArray = station.stops;
    // nothing to flip at stations with only 1 platform
    if (stopsArray.length > 1) {
      // try several different algorithms to figure out
      // which stops (if any) should be flipped
      for (const f of flipFunctions) {
        const stopsToFlip = f(stopsArray, data, station, warnings);
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

  const imageUrls: { [qId: string]: string } = {};

  const networkMetadata: Data['networks'] = stations
    .flatMap((station) => station.networks)
    .filter(uniq)
    .map((qId) => {
      const item = <Item>wikidata[qId];
      if (!item?.claims) {
        throw new Error(`No wikidata info for ${qId}`);
      }
      const firstSupportedLanguage =
        languages.find((lang) => item.labels?.[lang]) || 'en';

      const wikipediaPage = languages
        .map((lang) => {
          const page = item.sitelinks?.[<Site>`${lang}wiki`]?.title;
          if (!page) return undefined;
          return `${lang}:${page.replaceAll(' ', '_')}`;
        })
        .find(Boolean);

      const bestLogo = (item.claims.P8972 || item.claims.P154)
        ?.filter((claim) => claim.mainsnak.datatype === 'commonsMedia')
        .sort(sortByRank)[0]?.mainsnak.datavalue?.value;

      const fbUsername =
        item.claims.P2013?.sort(sortByRank)[0]?.mainsnak.datavalue?.value;

      const logoUrl = bestLogo
        ? `http://commons.wikimedia.org/wiki/Special:FilePath/${bestLogo}`
        : fbUsername
          ? `https://graph.facebook.com/${fbUsername}/picture?type=large`
          : undefined;

      if (logoUrl) imageUrls[qId] = logoUrl;

      return {
        qId,
        name: item.labels?.[firstSupportedLanguage]?.value || '',
        wikipedia: wikipediaPage,
        logoUrl: logoUrl && `${API_BASE_URL}/image?qId=${qId}`,
      };
    })
    .sort((a, b) => b.name.localeCompare(a.name));

  const { routes, nodesWithNoData } = await getAllRoutes(
    data,
    wikidata,
    stationsByStopId,
    languages,
  );

  return {
    imageUrls,
    toClient: {
      warnings,
      stations: stations.sort((a, b) => a.name.localeCompare(b.name)),
      networks: networkMetadata,
      routes,
      nodesWithNoData,
      supportedSymbols: Object.fromEntries(
        Object.values(ICONS)
          .flatMap(Object.keys)
          .map((symbol) => [
            symbol,
            `${API_BASE_URL}/image?qId={qId}&symbol=${symbol}`,
          ]),
      ),
      lastGenerated: new Date().toISOString(),
      lastUpdated,
    },
  };
}
