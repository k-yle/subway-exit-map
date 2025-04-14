import { useMemo, useState } from 'react';
import clsx from 'clsx';
import TimeAgo from 'react-timeago-i18n';
import { Button, List, Modal } from '@arco-design/web-react';
import { Link } from 'react-router-dom';
import type { Carriage, Data, Station, Stop } from '../types.def';
import { countAdjacentEqual } from '../helpers/countAdjacentEqual';
import { bold, formatList, getName, locale, t } from '../i18n';
import { Arrow, Icon } from './Icon';
import { RenderAdjacentStops } from './RenderAdjacentStops';
import { PlatformName } from './PlatformName';
import notAccessible from './icons/NotAccessible.svg';
import { RouteShield } from './RouteShield';
import { RenderSymbol } from './icons/RenderSymbol';

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
        carriages.map(
          (x) => `${x.exitNumber}${x.exitTo}${x.exitSymbols}${x.unavailable}`,
        ),
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
          regular: t('generic.to'),
          occasional: (
            <>
              {t('generic.from')}
              <sup>†</sup>
            </>
          ),
          no: t('generic.from'),
          unknown: t('generic.from'),
        }[stop.biDiMode || 'no']
      }
      stops={stop.lastStop}
    />
  );
  const to = (
    <RenderAdjacentStops label={t('generic.to')} stops={stop.nextStop} />
  );

  const flatRoutes = Object.values(stop.routes).flat();

  return (
    <>
      {isModalOpen && (
        <Modal
          visible
          onOk={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          hideCancel
          okText={t('generic.close')}
        >
          {t('RenderDiagram.history', {
            bold,
            platformName: stop.platform
              ? t('RenderDiagram.platform.with-ref', { ref: stop.platform })
              : t('RenderDiagram.platform.no-ref', {
                  shields: (
                    <PlatformName
                      key={0}
                      stop={stop}
                      includeDestinations={false}
                    />
                  ),
                }),
            stationName: getName(station.name),
            timeAgo: (
              <TimeAgo key={1} date={stop.lastUpdate.date} locale={locale} />
            ),
            user: (
              <a
                key={2}
                href={`https://osm.org/user/${stop.lastUpdate.user}`}
                target="_blank"
                rel="noreferrer"
              >
                {stop.lastUpdate.user}
              </a>
            ),
          })}
          <br />
          <a
            href={`https://osm.org/node/${stop.nodeId}`}
            target="_blank"
            rel="noreferrer"
          >
            {t('generic.view-on', { name: 'OpenStreetMap' })}
          </a>
          <br />
          <br />
          {!!flatRoutes.length && (
            <List
              dataSource={flatRoutes}
              render={(route, index) => (
                <List.Item key={index}>
                  <Link
                    to={`/routes/${route.qId[0]}/${route.shieldKey}/${route.osmId}`}
                  >
                    <Button type="text">
                      <RouteShield route={route} />{' '}
                      {t('RenderDiagram.route', {
                        to: formatList(route.to || []),
                      })}
                    </Button>
                  </Link>
                </List.Item>
              )}
            />
          )}
        </Modal>
      )}
      {stop.exitSide &&
        t('RenderDiagram.exit-side', {
          bold,
          side: {
            left: t('generic.left'),
            right: t('generic.right'),
            both: t('generic.both_sides'),
          }[stop.exitSide],
        })}
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
                    <span>
                      {t('RenderDiagram.exit-number', {
                        ref: formatList(carriage.exitNumber),
                      })}
                    </span>
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
                  <div className="flexCentre">
                    {carriage.exitSymbols?.map((symbol) => (
                      <RenderSymbol
                        key={symbol}
                        symbol={symbol}
                        data={data}
                        networks={station.networks}
                      />
                    ))}
                  </div>
                  {carriage.unavailable && (
                    <strong>{t('RenderDiagram.short-platform.title')}</strong>
                  )}
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
                    t('RenderDiagram.short-platform.subtitle')}
                  {carriage.exitTo &&
                    t('RenderDiagram.route', {
                      to: formatList(carriage.exitTo),
                    })}
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
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
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
                ? t('RenderDiagram.platform-name', {
                    station: getName(stop.disambiguationName || station.name),
                    platform: stop.platform,
                  })
                : getName(station.name)}{' '}
              {stop.description && `(${stop.description}) `}
              {stop.inaccessible && (
                <img
                  alt={t('generic.inaccessible') as string}
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
