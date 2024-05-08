import { Fragment, useContext } from 'react';
import { RouterContext } from '../context';
import type { AdjacentStop } from '../types.def';
import { orFormatter } from '../helpers/i18n';

export const RenderAdjacentStops: React.FC<{
  label: React.ReactNode;
  stops: AdjacentStop[];
}> = ({ label, stops }) => {
  const navigateTo = useContext(RouterContext);

  const onClick = (stop: AdjacentStop) => (event: React.MouseEvent) => {
    event.preventDefault();
    navigateTo(stop.gtfsId!);
  };

  if (!stops.length) return null;

  return (
    <>
      {label}{' '}
      {orFormatter
        .formatToParts(stops.map((_, index) => `${index}`))
        .map((part) => {
          if (part.type === 'literal') return part.value;
          const stop = stops[+part.value];
          return (
            <Fragment
              key={`${stop.gtfsId}-${stop.stationName}-${stop.platform}`}
            >
              {stop.gtfsId ? (
                <a href={`#${stop.gtfsId}`} onClick={onClick(stop)}>
                  {stop.stationName} {stop.platform}
                </a>
              ) : (
                <>
                  {stop.stationName} {stop.platform}
                </>
              )}
            </Fragment>
          );
        })}
    </>
  );
};
