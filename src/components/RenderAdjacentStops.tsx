import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdjacentStop } from '../types.def';
import { getName, orFormatter } from '../i18n';

export const RenderAdjacentStops: React.FC<{
  label: React.ReactNode;
  stops: AdjacentStop[];
}> = ({ label, stops }) => {
  const navigate = useNavigate();

  const onClick = (stop: AdjacentStop) => (event: React.MouseEvent) => {
    event.preventDefault();
    navigate(`/${stop.gtfsId!}`, { replace: true });
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
            <Fragment key={stop.nodeId}>
              {stop.gtfsId ? (
                // TODO: why the fake anchor ??
                <a href={`#${stop.gtfsId}`} onClick={onClick(stop)}>
                  {getName(stop.stationName)} {stop.platform}
                </a>
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
