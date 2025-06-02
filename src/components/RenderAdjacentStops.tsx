import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import type { AdjacentStop } from '../types.def';
import { getName, orFormatter } from '../i18n';

export const RenderAdjacentStops: React.FC<{
  label: React.ReactNode;
  stops: AdjacentStop[];
}> = ({ label, stops }) => {
  if (!stops.length) return null;

  return (
    <>
      {label}{' '}
      {orFormatter
        .formatToParts(stops.map((_, index) => `${index}`))
        .map((part) => {
          if (part.type === 'literal') return part.value;
          const stop = stops[+part.value]!;
          return (
            <Fragment key={stop.nodeId}>
              {stop.gtfsId ? (
                <Link to={`/${stop.gtfsId!}`} replace>
                  {getName(stop.stationName)} {stop.platform}
                </Link>
              ) : (
                <>
                  {getName(stop.stationName)} {stop.platform}
                </>
              )}
            </Fragment>
          );
        })}
    </>
  );
};
