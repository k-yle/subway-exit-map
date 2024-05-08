/* eslint-disable jsx-a11y/control-has-associated-label */
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import TimeAgo from 'react-timeago-i18n';
import type { Data, Station, Stop } from '../types.def';
import { countAdjacentEqual } from '../helpers/countAdjacentEqual';
import { formatList } from '../helpers/i18n';
import { Arrow, Icon } from './Icon';
import { RenderAdjacentStops } from './RenderAdjacentStops';
import { Modal } from './Modal';
import { PlatformName } from './PlatformName';
// eslint-disable-next-line import/extensions
import notAccessible from './icons/NotAccessible.svg';

export const RenderDiagram: React.FC<{
  data: Data;
  station: Station;
  stop: Stop;
}> = ({ data, station, stop }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const carriages = stop.flip ? stop.carriages : [...stop.carriages].reverse();
  const cars = carriages.length;

  const colSpans = useMemo(
    () =>
      countAdjacentEqual(
        carriages.map((x) =>
          x.type === 'ellipsis' ? '' : `${x.exitNumber}${x.exitTo}`,
        ),
      ),
    [carriages],
  );

  const from = (
    <RenderAdjacentStops
      label={
        {
          regular: 'To',
          occasional: (
            <>
              From<sup>†</sup>
            </>
          ),
          no: 'From',
        }[stop.biDiMode || 'no']
      }
      stops={stop.lastStop}
    />
  );
  const to = <RenderAdjacentStops label="To" stops={stop.nextStop} />;

  return (
    <>
      {isModalOpen && (
        <Modal isOpen onClose={() => setIsModalOpen(false)}>
          <strong>
            {stop.platform ? (
              `Platform ${stop.platform} `
            ) : (
              <>
                The <PlatformName stop={stop} includeDestinations={false} />{' '}
                Platform
              </>
            )}
          </strong>{' '}
          at <strong>{station.name}</strong> was last edited{' '}
          <TimeAgo date={stop.lastUpdate.date} /> by{' '}
          <a
            href={`https://osm.org/user/${stop.lastUpdate.user}`}
            target="_blank"
            rel="noreferrer"
          >
            {stop.lastUpdate.user}
          </a>
          <br />
          <br />
          <a
            href={`https://osm.org/node/${stop.nodeId}`}
            target="_blank"
            rel="noreferrer"
          >
            View on OpenStreetMap
          </a>
        </Modal>
      )}
      {stop.exitSide && (
        <>
          Exit on the <strong>{stop.exitSide}</strong>
        </>
      )}
      <table>
        <tbody>
          {/* first row - the exit numbers */}
          <tr>
            <td />
            {carriages.map((carriage, index) => {
              const colSpan = colSpans[index];
              if (carriage.type === 'ellipsis' || !colSpan) return null;

              return (
                <td key={carriage.ref} className="exitRef" colSpan={colSpan}>
                  {carriage.exitNumber && (
                    <span>Exit {formatList(carriage.exitNumber)}</span>
                  )}
                </td>
              );
            })}
            <td />
          </tr>

          {/* second row - the exit symbols */}
          <tr>
            <td />
            {carriages.map((carriage, index) => {
              const colSpan = colSpans[index];
              if (carriage.type === 'ellipsis' || !colSpan) return null;

              return (
                <td key={carriage.ref} colSpan={colSpan}>
                  {carriage.exitSymbols
                    ?.filter((symbol) => data.supportedSymbols[symbol])
                    .map((symbol) => (
                      <img
                        key={symbol}
                        src={data.supportedSymbols[symbol]}
                        alt={symbol}
                        style={{ width: 20, height: 20 }}
                      />
                    ))}
                  {carriage.unavailable && 'No exit at'}
                </td>
              );
            })}
            <td />
          </tr>

          {/* third row - the exit names */}
          <tr className="destinationRow">
            <td />
            {carriages.map((carriage, index) => {
              const colSpan = colSpans[index];
              if (carriage.type === 'ellipsis' || !colSpan) return null;

              return (
                <td key={carriage.ref} colSpan={colSpan}>
                  {carriage.unavailable && 'this station'}
                  {carriage.exitTo && <>to {formatList(carriage.exitTo)}</>}
                </td>
              );
            })}
            <td />
          </tr>

          {/* fourth row - the exit types */}
          <tr className="exitSymbolRow">
            <td />
            {carriages.map((carriage) => {
              if (carriage.type === 'ellipsis') {
                return <td key={carriage.ref} />;
              }
              return (
                <td key={carriage.ref}>
                  {carriage.unavailable && '🚫'}
                  {carriage.exitType && (
                    <>
                      {carriage.exitType.map((type) => (
                        <Icon key={type} type={type} />
                      ))}
                    </>
                  )}
                </td>
              );
            })}
            <td />
          </tr>

          {/* fifth row - the train */}
          <tr>
            <td>
              {(stop.flip || stop.biDiMode === 'regular') && <Arrow flip />}
            </td>
            {carriages.map((carriage) => {
              return (
                <td key={carriage.ref}>
                  <div
                    className={clsx(
                      carriage.type,
                      'isBest' in carriage && carriage.isBest && 'best',
                    )}
                  >
                    {carriage.type === 'ellipsis' ? '…' : carriage.ref}
                  </div>
                  {/* TODO: render elipsis */}
                </td>
              );
            })}
            <td>{(!stop.flip || stop.biDiMode === 'regular') && <Arrow />}</td>
          </tr>

          {/* sixth row - the platform */}
          <tr>
            <td>{stop.flip ? to : from}</td>
            <td
              colSpan={cars}
              className="platform"
              tabIndex={0}
              role="button"
              onClick={(event) => {
                event.preventDefault();
                setIsModalOpen(true);
              }}
            >
              {stop.platform
                ? `${station.name}, Platform ${stop.platform}`
                : station.name}{' '}
              {stop.description && `(${stop.description}) `}
              {stop.inaccessible && (
                <img
                  alt="Platform is not wheelchair accessible"
                  src={notAccessible}
                  style={{ height: '1.2rem', verticalAlign: 'bottom' }}
                />
              )}
              <br />
              <PlatformName stop={stop} includeDestinations />
            </td>
            <td>{stop.flip ? from : to}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};
