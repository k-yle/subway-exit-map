import { Fragment, useContext } from 'react';
import clsx from 'clsx';
import type { Stop } from '../types.def';
import { uniqBy } from '../helpers/objects';
import { SettingsContext } from '../context/settings';
import { t } from '../i18n';
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
          {routes[0].type === 'from' && t('RoutesInfo.exit_only')}{' '}
          {routes.map((route) => (
            <RouteShield key={JSON.stringify(route)} route={route} />
          ))}{' '}
          {
            {
              to: t('generic.to_lower'),
              from: t('generic.from_lower'),
              both: t('generic.to-from'),
            }[routes[0].type]
          }{' '}
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
                  <em>
                    {' '}
                    {t(
                      'PlatformName.pass-through.from',
                      route.isDuplicate,
                    )}{' '}
                  </em>
                )}
                {route.isDuplicate?.to && (
                  <em>
                    {' '}
                    {t('PlatformName.pass-through.to', route.isDuplicate)}{' '}
                  </em>
                )}
              </Fragment>
            );
          })}
          <em>{t('PlatformName.pass-through')}</em>
        </small>
      )}
    </>
  );
};
