### Flipping

We want the platforms to roughly match their true orientation, rather than always having `from` on the left, since this is a bit confusing.

For example:

```
------(1)----->
Island Platform
<-----(2)------
------(3)----->
Island Platform
<-----(4)------
```

Here, we should flip platform 2 & 4 so that they're in the opposite direction to platform 1 & 3.

There are several possible methods:

1.  Align matching destinations on the same side

    **Prerequisites:** Every platform must have scheduled services.

    **Flaws:**

2.  Use the track geometry

    **Prerequisites:** The tracks must be tagged as [oneway](https://osm.wiki/Key:railway:preferred_direction).

    **Flaws:** Requires us to download track geometry near stations, and fails if the station has platforms at angles other than 0° and 180°.

3.  Use the stop position location relative to the centroid of the station.

    **Prerequisites:** All tracks must be unidirectional.

    **Flaws:** It's only a coincidence that most stop positions are mapped at the front of the platform. It fails if stop positions are mapped at the centre of the platform, and there is no way of knowing if the result is bogus because of this.

We try all 3 approaches in the foregoing order.
