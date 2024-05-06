[out:json][timeout:180];

// get all nodes with *:carriages:* tags from around the world
(
  node["exit:carriages"];
  node["exit:carriages:forward"];
  node["exit:carriages:backward"];
) -> .stops;

// get all relations that contain our nodes (routes and stop areas)
rel(bn.stops) -> .allRelations;

// get all ways (train tracks) that contain the stop nodes
way(bn.stops) -> .stationTrackWays;
// and then get all nodes of those train tracks
node(w.stationTrackWays) -> .stationTrackNodes;

// split out the stop_area relations
rel.allRelations[public_transport=stop_area]->.stopAreas;

// filter out train routes with no `network:wikidata` tag, the idea
// is to filter out regional trains that have 1000+ members and
// aren't useful or relevant.
rel.allRelations["network:wikidata"]->.suburbanTrainRoutes;

// get all stops from all suburban routes that pass
// through a station with data, even if those stops
// have no exit info.
(
  .stops;
  node(r.suburbanTrainRoutes)[public_transport=stop_position];
)->.stops;

// get all stations that are part of the stop-area relations
nwr(r.stopAreas)[public_transport=station]->.stations;

// don't output every relation, just the ones we want
(.stops; .stations; .stopAreas; .suburbanTrainRoutes; .stationTrackWays; .stationTrackNodes;);
out meta;
