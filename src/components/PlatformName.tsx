import { Fragment, useContext } from 'react';
import clsx from 'clsx';
import type { Stop } from '../types.def';
import { uniqBy } from '../helpers/objects';
import { SettingsContext } from '../context/settings';
import { RouteShield } from './RouteShield';

export const PlatformName: React.FC<{
  stop: Stop;
  includeDestinations: boolean;
}> = ({ stop, includeDestinations }) => {
  const { settings } = useContext(SettingsContext);

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
      {settings.showPassThroughRoutes && stop.passThroughRoutes && (
        <small className="strikeThrough">
          {stop.passThroughRoutes.map((route) => {
            return (
              <Fragment key={JSON.stringify(route)}>
                <RouteShield route={route} />
                {route.isDuplicate?.from && (
                  <em> (from {route.isDuplicate?.from}) </em>
                )}
                {route.isDuplicate?.to && (
                  <em> (to {route.isDuplicate?.to}) </em>
                )}
              </Fragment>
            );
          })}
          <em>does not stop here</em>
        </small>
      )}
    </>
  );
};
