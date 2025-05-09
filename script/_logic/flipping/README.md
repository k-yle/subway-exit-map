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

#### Implementation

- For every `stop_position` node, find the next node along the track.
- Calculate the bearing between the `stop_position` and the next node, which is the same as the bearing of the track (unless the platform is built on a curve). In most cases, the (normalised) bearings will be close to either 0° or 180°, even for curved platforms<sup>†</sup>
- Group the bearings using [k-means clustering](https://en.wikipedia.org/wiki/K-means_clustering), into two distinct groups.
- Flip every stop in one of the two groups.

#### Flaws

† = This approach is less reliable at stations where the platforms that are not all parralel, such as [Berlin Hbf](https://osm.org/relation/910651) or Sydney's [Martin Place](https://osm.org/relation/9769474). If the tracks were perfectly perpendicular, then this algorithm would produce unexpected results. But at the time of writing, this algorithm works for all 980 stops where we have data.
