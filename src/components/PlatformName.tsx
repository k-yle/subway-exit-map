import clsx from 'clsx';
import type { Stop } from '../types.def';
import { uniqBy } from '../helpers/objects';
import { RouteShield } from './RouteShield';

export const PlatformName: React.FC<{
  stop: Stop;
  includeDestinations: boolean;
}> = ({ stop, includeDestinations }) => {
  if (!includeDestinations) {
    return (
      <small>
        {uniqBy(Object.values(stop.routes).flat(), (route) => route.ref).map(
          (route) => (
            <RouteShield key={route.ref} route={route} />
          ),
        )}
      </small>
    );
  }

  return (
    <>
      {Object.entries(stop.routes).map(([to, routes]) => (
        <small
          key={to}
          className={clsx(routes[0].type === 'from' && 'italics')}
        >
          {routes[0].type === 'from' && 'Drop-off only: '}
          {routes.map((route) => (
            <RouteShield key={JSON.stringify(route)} route={route} />
          ))}
          {{ to: ' to ', from: ' from ', both: ' to/from ' }[routes[0].type]}
          {to}
          <br />
        </small>
      ))}
    </>
  );
};
