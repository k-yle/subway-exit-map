# Subway Exit Map

![](https://github.com/k-yle/subway-exit-map/actions/workflows/ci.yml/badge.svg)
![](https://github.com/k-yle/subway-exit-map/actions/workflows/cron.yml/badge.svg)
![Lines of code](https://sloc.xyz/github/k-yle/subway-exit-map)

🚇🛗 Some subway or train platforms only have an exit on one end of the platform, which means people might need to walk a long distance down the platform if they arrive in the wrong carriage.

This app uses [data from OpenStreetMap](https://osm.wiki/Key:exit:carriages) to show which carriage of a train is the closest to the exit when arriving at the station, to avoid a long walk down the platform to the exit or elevator.

![](https://upload.wikimedia.org/wikipedia/commons/0/0d/Train_platform_exit_locations_with_destination.png)

## [Demo App](https://exits.to) — [API](https://kyle.kiwi/subway-exit-map/api.json) — [Data Model](https://osm.wiki/Key:exit:carriages)

### License

- [The data](https://kyle.kiwi/subway-exit-map/api.json) is sourced from OpenStreetMap and licensed under the [ODbL license](https://osm.org/copyright). Some complementary data is also souced from [Wikidata](https://wikidata.org), and licensed under the [Creative Commons CC0 license](https://wikidata.org/wiki/Wikidata:Copyright).
- The code is licensed under the [MIT license](./LICENSE).

### Data Sources

Every OpenStreetMap feature with an [`exit:carriages[:*]`](https://osm.wiki/Key:exit:carriages) tag is extracted.
Many related entities are then fetched using an Overpass and SPARQL query, as shown in the following diagram (colour coded by data source):

```mermaid
classDiagram
namespace scope_of_this_app {
    class OSM_stop_area_group["OSM stop_area_group"] {
    }
    class OSM_stop_area["OSM stop_area"] {

    }
    class OSM_platform["OSM platform"] {
        ref
        wheelchair
    }
    class OSM_station["OSM station"] {
        name[:*]
        fare_gates
        network
        network:wikidata
    }
    class OSM_stop["OSM stop_position"] {
        local_ref
        ref
        description
        wheelchair
        exit:carriages[:*]
        destination:carriages[:*]
    }
    class OSM_track["OSM track"] {
        [oneway direction]
        [is bidirectional]
    }
    class OSM_route["OSM route"] {
        network
        network:wikidata
        wikidata
        colour
        to/from/via
        to:ref
        from:ref
    }

    class Q_route["Wikidata route"]:::wikidata {
        P3438 Vehicle Normally Used
        ⤷ P2668 Stability [Usually/Always]
        ⤷ P2043 Number of Carriages
        P527 Has Part→Q5759965 Route Shield
        ⤷P1419 Shape
    }
    class Q_network["Wikidata network"]:::wikidata {
        P17 Country
        P2283 Uses→Q570730 Platform Screen Doors
        ⤷ P2283 Uses→Q82990 Numbered Doors
        ⤷ P1545 First Door Numbered
        P154 Logo
        P8972 Logo Small
        P2013 Facebook Username
        P8253 name-suggestion-index ID
    }
    class Commons:::wikidata {
        logo
    }
    class Facebook:::other {
        logo
    }
    class NSI["NSI Entry"]:::other {
        facebookUrl
        commonsUrl
    }
    class Q_train["Wikidata train"]:::wikidata {
        P527 Has Part→Q36794 Door
        ⤷ P1114 Quantity per carriage
        ⤷ P10177 Position
    }
}
class GTFS_stop:::other {
    stop_code
}

OSM_stop_area_group --> OSM_stop_area : member
OSM_stop_area --> OSM_platform : member
OSM_stop_area --> OSM_stop : member
OSM_stop_area --> OSM_station : member
OSM_station --> Q_network : network﹕wikidata
OSM_track --> OSM_stop : contains node
OSM_route --> OSM_track : member
OSM_route --> OSM_stop : member
OSM_route --> Q_route : wikidata
OSM_route --> Q_network : network﹕wikidata
OSM_stop "ref" <--> "stop_code" GTFS_stop
Q_route --> Q_train : P3438 Vehicle Normally Used
OSM_platform "ref" <--> "local_ref" OSM_stop
Q_network --> NSI : P8253 NSI ID
Q_network --> Commons : P154 Logo
Q_network --> Commons : P8972 Logo Small
Q_network --> Facebook : P2013 Facebook Username
NSI --> Commons : commonsUrl
NSI --> Facebook : facebookUrl
OSM_route --> NSI : network
OSM_station --> NSI : network

classDef wikidata fill:#cde498,stroke:#1e8213;
classDef other fill:#fff5ad,stroke:#aaaa33;
```

### Regions with Data

This map is [automatically generated](./script/build/generateReadmeMap.ts) from the OpenStreetMap data.
A more precise map is [available from _taginfo_](https://taginfo.osm.org/keys/exit:carriages:forward#map).

[![Map showing regions that have data](https://kyle.kiwi/subway-exit-map/map.svg)](https://exits.to)
