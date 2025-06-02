import { Fragment, useContext, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, List, Tag, Typography } from '@arco-design/web-react';
import { IconCaretLeft, IconCaretRight } from '@arco-design/web-react/icon';
import TimeAgo from 'react-timeago-i18n';
import type { ItemId } from 'wikibase-sdk';
import { DataContext } from '../context/data';
import { RouteShield } from '../components/RouteShield';
import notAccessibleBlack from '../components/icons/NotAccessibleBlack.svg';
import iconCaretBothSides from '../components/icons/BothSides.svg';
import { SettingsContext } from '../context/settings';
import { Settings } from '../components/Settings';
import { MiniTrainDiagram } from '../components/MiniTrainDiagram';
import { type I18nComp, formatList, getName, locale, t } from '../i18n';
import { copyrightFooter } from '../components/text';
import { DIRECTIONS, type Direction } from '../helpers/directions';
import { TrainsetInfo } from './TrainsetInfo';

const noop: I18nComp = (x) => x;

const inaccessible = (
  <img
    alt={t('generic.inaccessible') as string}
    src={notAccessibleBlack}
    style={{ height: '1.2rem', verticalAlign: 'bottom' }}
  />
);

const SIDE_ICONS = {
  left: <IconCaretLeft />,
  right: <IconCaretRight />,
  both: <img src={iconCaretBothSides} alt="" className="arco-icon" />,
};

export const RoutesInfo: React.FC = () => {
  const qId = useParams<{ qId: ItemId }>().qId!;
  const shieldKey = useParams().shieldKey!;
  const relationId = useParams().relationId!;

  const data = useContext(DataContext);
  const { settings } = useContext(SettingsContext);

  const network = data.networks.find((n) => n.qId === qId);
  const route = data.routes[qId]?.[shieldKey];
  const variant = data.routes[qId]?.[shieldKey]?.variants[relationId];

  const legend = useMemo(() => {
    if (!variant) return [];

    const allStationIds = new Set(variant.stops.map((s) => s.stationRelation));
    const allStopIds = new Set(variant.stops.map((s) => s.stopNode));

    const allStations = data.stations.filter((s) =>
      allStationIds.has(s.relationId),
    );
    const allStops = data.stations
      .flatMap((s) => s.stops)
      .filter((s) => allStopIds.has(s.nodeId));

    const hasSides = allStops.some((s) => s.exitSide);
    const hasBoth = allStops.some((s) => s.exitSide === 'both');
    const hasFareGates = allStations.some((s) => s.fareGates);

    return [
      {
        icon: SIDE_ICONS.left,
        label: t('RenderDiagram.exit-side', {
          side: t('generic.left'),
          bold: noop,
        }),
        if: hasSides,
      },
      {
        icon: SIDE_ICONS.right,
        label: t('RenderDiagram.exit-side', {
          side: t('generic.right'),
          bold: noop,
        }),
        if: hasSides,
      },
      {
        icon: SIDE_ICONS.both,
        label: t('RenderDiagram.exit-side', {
          side: t('generic.both_sides'),
          bold: noop,
        }),
        if: hasBoth,
      },
      {
        icon: inaccessible,
        label: t('Legend.inaccessible'),
        if: allStops.some((s) => s.inaccessible),
      },
      { icon: '🔒', label: t('Legend.fare-gates.yes'), if: hasFareGates },
      {
        icon: '🔓',
        label: t('Legend.fare-gates.no'),
        if: hasFareGates,
      },
      {
        icon: '🔏',
        label: t('Legend.fare-gates.partial'),
        if: allStations.some((s) => s.fareGates === 'partial'),
      },
    ];
  }, [data, variant]);

  if (!route || !variant || !network) return null;

  const wikipedia = getName(route.wikidata?.wikipedia || {});

  return (
    <div className="main">
      <Link to={`/routes/${qId}/${shieldKey}`}>{t('generic.back')}</Link>
      <Typography.Title heading={3} className="verticalCentre">
        {network.logoUrl && (
          <Avatar size={32}>
            <img alt={getName(network.name)} src={network.logoUrl} />
          </Avatar>
        )}
        <RouteShield route={route.shield} />
        {variant.tags.via?.length
          ? t('RoutesByShield.label.from-to-via', {
              ...variant.tags,
              via: formatList(variant.tags.via),
            })
          : t('RoutesByShield.label.from-to', variant.tags)}
      </Typography.Title>
      <div className="main subtitle">
        {DIRECTIONS[variant.tags.direction as Direction]}
      </div>

      {route.wikidata?.trainsets && (
        <TrainsetInfo trainsets={route.wikidata.trainsets} />
      )}
      <List
        dataSource={variant.stops}
        render={(stopMeta, index) => {
          const isFirst = index === 0;
          const isLast = index === variant.stops.length - 1;

          const station = data.stations.find(
            (s) => s.relationId === stopMeta.stationRelation,
          );
          const stop =
            station?.stops.find((s) => s.nodeId === stopMeta.stopNode) ||
            data.nodesWithNoData[stopMeta.stopNode];

          if (!stop) {
            return (
              <List.Item key={stopMeta.stopNode}>
                <a
                  href={`https://osm.org/node/${stopMeta.stopNode}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button type="text">
                    <Typography.Text type="error">
                      {t('generic.unknown')}
                    </Typography.Text>
                  </Button>
                </a>
              </List.Item>
            );
          }

          const prefix = (
            <>
              {SIDE_ICONS[stop.exitSide!]}
              {!index && variant.tags.fromRef && (
                <RouteShield
                  route={{
                    colour: route.shield.colour,
                    shape: 'circle',
                    ref: variant.tags.fromRef,
                  }}
                />
              )}
              {index === variant.stops.length - 1 && variant.tags.toRef && (
                <RouteShield
                  route={{
                    colour: route.shield.colour,
                    shape: 'circle',
                    ref: variant.tags.toRef,
                  }}
                />
              )}
            </>
          );
          const suffix = (
            <>
              {stop?.platform}
              {stopMeta.requestOnly && <Tag>{t('RoutesInfo.on_request')}</Tag>}
              {(stopMeta.restriction === 'entry_only' || isFirst) && (
                <Tag>{t('RoutesInfo.entry_only')}</Tag>
              )}
              {(stopMeta.restriction === 'exit_only' || isLast) && (
                <Tag>{t('RoutesInfo.exit_only')}</Tag>
              )}
            </>
          );

          const connectingRoutes = settings.showConnectingRoutes
            ? Object.values(data.routes)
                .flatMap((n) => Object.entries(n))
                .filter(
                  (shield) =>
                    Object.values(shield[1].variants)
                      .flatMap((r) => r.stops.map((s) => s.stationRelation))
                      .includes(stopMeta.stationRelation) &&
                    shield[0] !== shieldKey,
                )
                .sort(([, a], [, b]) =>
                  (a.shield.ref || '').localeCompare(b.shield.ref || ''),
                )
            : [];

          return (
            <List.Item key={stopMeta.stopNode}>
              {stop && 'name' in stop ? (
                <Typography.Text disabled className="not-button">
                  {prefix}
                  {getName(stop.name)} {suffix}
                </Typography.Text>
              ) : stop && station ? (
                <Link to={`/${station.gtfsId}`}>
                  <Button type="text">
                    {prefix}
                    {getName(station.name)}
                    {suffix}
                    {stop.shortPlatform && (
                      <Tag>
                        {t('ShortPlatform.label', {
                          n: stop.shortPlatform.count,
                          alignment: {
                            first: t('ShortPlatform.align.first'),
                            middle: t('ShortPlatform.align.middle'),
                            last: t('ShortPlatform.align.last'),
                          }[stop.shortPlatform.alignment],
                        })}
                      </Tag>
                    )}
                    {{ yes: '🔒', no: '🔓', partial: '🔏' }[station.fareGates!]}
                    {stop.inaccessible && inaccessible}
                    <div>
                      {connectingRoutes.map(([key, shield]) => (
                        <RouteShield key={key} route={shield.shield} />
                      ))}
                    </div>
                    <MiniTrainDiagram carriages={stop.carriages} />
                  </Button>
                </Link>
              ) : null}
            </List.Item>
          );
        }}
      />
      {!!legend.length && (
        <Typography.Title heading={6}>{t('Legend.title')}</Typography.Title>
      )}
      <table className="legend">
        <tbody>
          {legend
            .filter((item) => item.if)
            .map((item) => (
              <tr key={item.label.toString()}>
                <td>{item.icon}</td>
                <td>=</td>
                <td>{item.label}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <br />
      {t('RoutesInfo.footer', {
        settings: <Settings key={0} />,
        timeAgo: (
          <TimeAgo key={1} date={variant.lastUpdate.date} locale={locale} />
        ),
        user: (
          <a
            key={2}
            href={`https://osm.org/user/${variant.lastUpdate.user}`}
            target="_blank"
            rel="noreferrer"
          >
            {variant.lastUpdate.user}
          </a>
        ),
      })}
      <br />
      {t('generic.view-on', {
        name: (
          <Fragment key={0}>
            <a
              href={`https://osm.org/relation/${relationId}`}
              target="_blank"
              rel="noreferrer"
            >
              OpenStreetMap
            </a>
            {route.wikidata?.qId && (
              <>
                {' | '}
                <a
                  href={`https://www.wikidata.org/wiki/${route.wikidata.qId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Wikidata
                </a>
              </>
            )}
            {wikipedia && (
              <>
                {' | '}
                <a
                  href={`https://en.wikipedia.org/wiki/${wikipedia}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Wikipedia
                </a>
              </>
            )}
          </Fragment>
        ),
      })}
      <br />
      <small>{copyrightFooter}</small>
    </div>
  );
};
