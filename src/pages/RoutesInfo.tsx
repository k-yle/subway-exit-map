import { Fragment, useContext, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, List, Tag, Typography } from '@arco-design/web-react';
import {
  IconCaretLeft,
  IconCaretRight,
  IconCode,
} from '@arco-design/web-react/icon';
import TimeAgo from 'react-timeago-i18n';
import type { ItemId } from 'wikibase-sdk';
import { DataContext } from '../context/data';
import { RouteShield } from '../components/RouteShield';
import notAccessibleBlack from '../components/icons/NotAccessibleBlack.svg';
import { SettingsContext } from '../context/settings';
import { Settings } from '../components/Settings';
import { MiniTrainDiagram } from '../components/MiniTrainDiagram';
import { locale, t } from '../i18n';
import { copyrightFooter } from '../components/text';
import { TrainsetInfo } from './TrainsetInfo';

const noop = <T,>(x: T) => x;

const inaccessible = (
  <img
    alt={t('generic.inaccessible') as string}
    src={notAccessibleBlack}
    style={{ height: '1.2rem', verticalAlign: 'bottom' }}
  />
);

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
    const hasFareGates = allStations.some((s) => s.fareGates);

    return [
      {
        icon: <IconCaretLeft />,
        label: t('RenderDiagram.exit-side', {
          side: t('generic.left'),
          bold: noop,
        }),
        if: hasSides,
      },
      {
        icon: <IconCaretRight />,
        label: t('RenderDiagram.exit-side', {
          side: t('generic.right'),
          bold: noop,
        }),
        if: hasSides,
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

  return (
    <div className="main">
      <Link to={`/routes/${qId}/${shieldKey}`}>{t('generic.back')}</Link>
      <Typography.Title heading={3} className="verticalCentre">
        <Avatar size={32}>
          <img alt={network.name} src={network.logoUrl} />
        </Avatar>
        <RouteShield route={route.shield} />
        {variant.tags.via
          ? t('RoutesByShield.label.from-to-via', variant.tags)
          : t('RoutesByShield.label.from-to', variant.tags)}
      </Typography.Title>
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

          const prefix = {
            left: <IconCaretLeft />,
            right: <IconCaretRight />,
            both: <IconCode />,
          }[stop.exitSide!];
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
                  {stop.name} {suffix}
                </Typography.Text>
              ) : stop && station ? (
                <Link to={`/${station.gtfsId}`}>
                  <Button type="text">
                    {prefix}
                    {station.name}
                    {suffix}
                    {stop.availableLabel && <Tag>{stop.availableLabel}</Tag>}
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
            {route.wikidata?.wikipedia && (
              <>
                {' | '}
                <a
                  href={`https://en.wikipedia.org/wiki/${route.wikidata.wikipedia}`}
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
