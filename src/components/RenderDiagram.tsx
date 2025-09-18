import { useMemo, useState } from 'react';
import clsx from 'clsx';
import TimeAgo from 'react-timeago-i18n';
import { Button, List, Modal } from '@arco-design/web-react';
import { Link } from 'react-router-dom';
import type { Data, Station, Stop } from '../types.def';
import { countAdjacentEqual } from '../helpers/countAdjacentEqual';
import { bold, formatList, getName, locale, t } from '../i18n';
import { uniqBy } from '../helpers/objects';
import { carTypeToCss } from '../helpers/carType';
import { DIRECTIONS } from '../helpers/directions';
import { groupExitRefs } from '../helpers/groupExitRefs';
import { Arrow, Icon } from './Icon';
import { RenderAdjacentStops } from './RenderAdjacentStops';
import { DEST_DELIMITER, PlatformName } from './PlatformName';
import notAccessible from './icons/NotAccessible.svg';
import { RouteShield } from './RouteShield';
import { RenderSymbol } from './icons/RenderSymbol';

export const RenderDiagram: React.FC<{
  data: Data;
  station: Station;
  stop: Stop;
}> = ({ data, station, stop }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const carriages = stop.flip ? stop.carriages : [...stop.carriages].reverse();

  const isFrontOnLeft = carriages.find((c) => c.type !== 'gap')?.ref === 1;

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

  const doorInfo = uniqBy(
    flatRoutes
      .flatMap((r) => {
        if (r.qId.length !== 1) return undefined; // does not support routes with multiple networks
        const trainsets =
          data.routes[r.qId[0]!]?.[r.shieldKey]?.wikidata?.trainsets;

        return trainsets?.map((train) => train.doors);
      })
      .filter((x) => !!x),
    (x) => `${x.alignment}|${x.quantity}`,
  );
  // if there are multiple different layouts, render nothing
  if (doorInfo.length !== 1) doorInfo.splice(0);

  const networksForStop = new Set(
    Object.values(stop.routes)
      .flat()
      .flatMap((route) => route.qId),
  );
  const networkQId =
    networksForStop.size === 1 ? [...networksForStop][0] : undefined;
  const { doorNumbers } = data.networks.find((n) => n.qId === networkQId) || {};

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
                      data={data}
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
              render={(route, index) => {
                const toName = formatList(
                  route.to?.map((name) => name.split(DEST_DELIMITER)[0]!) || [],
                );
                const toRefs = new Set(
                  route.to?.map(
                    (name) => name.split(DEST_DELIMITER)[1] || '',
                  ) || [],
                );
                toRefs.delete('');

                const routeDetails =
                  data.routes[route.qId[0]!]![route.shieldKey]!.variants[
                    route.osmId
                  ]!;

                const direction =
                  DIRECTIONS[routeDetails.tags.direction!] || '';

                return (
                  <List.Item key={index}>
                    <Link
                      to={`/routes/${route.qId[0]}/${route.shieldKey}/${route.osmId}`}
                    >
                      <Button type="text">
                        <div className="flex">
                          <div>
                            <RouteShield route={route} />{' '}
                            {t('RenderDiagram.route', { to: toName })}
                            {[...toRefs].map((toRef) => (
                              <RouteShield
                                key={toRef}
                                route={{
                                  colour: route.colour,
                                  shape: 'circle',
                                  ref: toRef,
                                }}
                              />
                            ))}
                          </div>
                          <div className="subtitle">{direction}</div>
                        </div>
                      </Button>
                    </Link>
                  </List.Item>
                );
              }}
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
                        ref: formatList(
                          groupExitRefs(carriage.exitNumber).map((item) =>
                            typeof item === 'string'
                              ? item
                              : t('generic.exit-range', {
                                  from: item[0],
                                  to: item[1],
                                }),
                          ),
                        ),
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
                  {/* so that the dotted line appears if there is a exit number but no exit name */}
                  {!carriage.exitTo && carriage.exitNumber && '\u00A0'}
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
            {carriages.map((carriage, carIndex) => {
              return (
                <td key={carriage.ref}>
                  <div
                    className={clsx(
                      carTypeToCss(carIndex, carriages),
                      'isBest' in carriage && carriage.isBest && 'best',
                      'unavailable' in carriage &&
                        carriage.unavailable &&
                        'unavailable',
                    )}
                  >
                    {doorInfo[0] &&
                    doorNumbers !== undefined &&
                    carriage.type !== 'gap' ? (
                      <label
                        className="doorNumbers"
                        style={{ justifyContent: doorInfo[0].alignment }}
                      >
                        {Array.from({ length: doorInfo[0].quantity }).map(
                          (_, index, { length }) => {
                            const base =
                              doorNumbers - 1 + (carriage.ref - 1) * length;
                            const doorNumber = isFrontOnLeft
                              ? base + index + 1
                              : base - index + length;

                            return (
                              // eslint-disable-next-line react/no-array-index-key
                              <span key={index}>{doorNumber}</span>
                            );
                          },
                        )}
                      </label>
                    ) : (
                      <label>
                        {carriage.type === 'gap' ? '\u00A0' : carriage.ref}
                      </label>
                    )}

                    {carriage.type !== 'gap' && doorInfo[0] && (
                      <div
                        className="doors"
                        style={{ justifyContent: doorInfo[0].alignment }}
                      >
                        {Array.from({ length: doorInfo[0].quantity }).map(
                          (_, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <span key={index}>&nbsp;</span>
                          ),
                        )}
                      </div>
                    )}
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
              <PlatformName stop={stop} includeDestinations data={data} />
            </td>
            {!!carsOffPlatformRight && <td colSpan={carsOffPlatformRight} />}
            <td>{stop.flip ? from : to}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};
