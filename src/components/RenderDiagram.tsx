/* eslint-disable jsx-a11y/control-has-associated-label */
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import TimeAgo from 'react-timeago-i18n';
import { Button, List } from '@arco-design/web-react';
import { Link } from 'react-router-dom';
import type { Carriage, Data, Station, Stop } from '../types.def';
import { countAdjacentEqual } from '../helpers/countAdjacentEqual';
import { formatList } from '../helpers/i18n';
import { Arrow, Icon } from './Icon';
import { RenderAdjacentStops } from './RenderAdjacentStops';
import { Modal } from './Modal';
import { PlatformName } from './PlatformName';
// eslint-disable-next-line import/extensions
import notAccessible from './icons/NotAccessible.svg';
import { RouteShield } from './RouteShield';

export const RenderDiagram: React.FC<{
  data: Data;
  station: Station;
  stop: Stop;
}> = ({ data, station, stop }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const carriages = stop.flip
    ? stop.carriages
    : [...stop.carriages].reverse().map((car): Carriage => {
        if (car.type === 'first') return { ...car, type: 'last' };
        if (car.type === 'last') return { ...car, type: 'first' };
        return car;
      });

  const colSpans = useMemo(
    () =>
      countAdjacentEqual(
        carriages.map((x) => `${x.exitNumber}${x.exitTo}${x.unavailable}`),
      ),
    [carriages],
  );

  const carsOffPlatformLeft = carriages.findIndex((car) => !car.unavailable);
  const carsOffPlatformRight =
    carriages.length - 1 - carriages.findLastIndex((car) => !car.unavailable);
  const carsOnPlatform = carriages.filter((car) => !car.unavailable).length;

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

  const flatRoutes = Object.values(stop.routes).flat();

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
          <a
            href={`https://osm.org/node/${stop.nodeId}`}
            target="_blank"
            rel="noreferrer"
          >
            View on OpenStreetMap
          </a>
          <br />
          <br />
          {!!flatRoutes.length && (
            <List
              dataSource={flatRoutes}
              render={(route, index) => (
                <List.Item key={index}>
                  <Link
                    to={`/routes/${route.qId}/${route.shieldKey}/${route.osmId}`}
                  >
                    <Button type="text">
                      <RouteShield route={route} /> to {route.to?.join(' & ')}
                    </Button>
                  </Link>
                </List.Item>
              )}
            />
          )}
        </Modal>
      )}
      {stop.exitSide && (
        <>
          Exit on the <strong>{stop.exitSide}</strong>
        </>
      )}
      <table className="table">
        <tbody>
          {/* first row - the exit numbers */}
          <tr>
            <td />
            {carriages.map((carriage, index) => {
              const colSpan = colSpans[index];
              if (!colSpan) return null;

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
              if (!colSpan) return null;

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
                  {carriage.unavailable && <strong>Short Platform!</strong>}
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
              if (!colSpan) return null;

              return (
                <td key={carriage.ref} colSpan={colSpan}>
                  {carriage.unavailable &&
                    'Doors will not open in these carriages'}
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
                      'unavailable' in carriage &&
                        carriage.unavailable &&
                        'unavailable',
                    )}
                  >
                    {carriage.type === 'gap' ? '\u00A0' : carriage.ref}
                  </div>
                </td>
              );
            })}
            <td>{(!stop.flip || stop.biDiMode === 'regular') && <Arrow />}</td>
          </tr>

          {/* sixth row - the platform */}
          <tr>
            <td>{stop.flip ? to : from}</td>
            {!!carsOffPlatformLeft && <td colSpan={carsOffPlatformLeft} />}
            <td
              colSpan={carsOnPlatform}
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
            {!!carsOffPlatformRight && <td colSpan={carsOffPlatformRight} />}
            <td>{stop.flip ? from : to}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};
