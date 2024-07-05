import { useContext, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Avatar,
  Button,
  List,
  Switch,
  Tag,
  Typography,
} from '@arco-design/web-react';
import {
  IconCaretLeft,
  IconCaretRight,
  IconCheck,
} from '@arco-design/web-react/icon';
import { DataContext } from '../context/data';
import { RouteShield } from '../components/RouteShield';
import notAccessibleBlack from '../components/icons/NotAccessibleBlack.svg';
import { SettingsContext } from '../context/settings';

const inaccessible = (
  <img
    alt="Platform is not wheelchair accessible"
    src={notAccessibleBlack}
    style={{ height: '1.2rem', verticalAlign: 'bottom' }}
  />
);

export const RoutesInfo: React.FC = () => {
  const qId = useParams().qId!;
  const shieldKey = useParams().shieldKey!;
  const relationId = useParams().relationId!;

  const data = useContext(DataContext);
  const { settings, setSettings } = useContext(SettingsContext);

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
      { icon: <IconCaretLeft />, label: 'Exit on the left', if: hasSides },
      { icon: <IconCaretRight />, label: 'Exit on the right', if: hasSides },
      {
        icon: inaccessible,
        label: 'Not Accessible',
        if: allStops.some((s) => s.inaccessible),
      },
      { icon: '🔒', label: 'Station has fare gates', if: hasFareGates },
      {
        icon: '🔓',
        label: 'Station does not have fare gates',
        if: hasFareGates,
      },
      {
        icon: '🔏',
        label: 'Station has fare gates at some exits',
        if: allStations.some((s) => s.fareGates === 'partial'),
      },
    ];
  }, [data, variant]);

  if (!route || !variant || !network) return null;

  return (
    <div className="main">
      <Link to={`/routes/${qId}/${shieldKey}`}>Back</Link>
      <Typography.Title heading={3} className="verticalCentre">
        <Avatar size={32}>
          <img alt={network.name} src={network.logoUrl} />
        </Avatar>
        <RouteShield route={route.shield} />{' '}
        <a
          href={`https://osm.org/relation/${relationId}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'black' }}
        >
          {variant.from} to {variant.to}
          {variant.via && ` via ${variant.via}`}
        </a>
      </Typography.Title>
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
                    <Typography.Text type="error">Unknown</Typography.Text>
                  </Button>
                </a>
              </List.Item>
            );
          }

          const prefix = { left: <IconCaretLeft />, right: <IconCaretRight /> }[
            stop.exitSide!
          ];
          const suffix = (
            <>
              {stop?.platform}
              {stopMeta.requestOnly && <Tag>On Request</Tag>}
              {(stopMeta.restriction === 'entry_only' || isFirst) && (
                <Tag>Pick up only</Tag>
              )}
              {(stopMeta.restriction === 'exit_only' || isLast) && (
                <Tag>Drop-off only</Tag>
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
                    {{ yes: '🔒', no: '🔓', partial: '🔏' }[station.fareGates!]}
                    {stop.inaccessible && inaccessible}
                    {/* TODO: show exit:carriages & access:carriages */}
                    <div>
                      {connectingRoutes.map(([key, shield]) => (
                        <RouteShield key={key} route={shield.shield} />
                      ))}
                    </div>
                  </Button>
                </Link>
              ) : null}
            </List.Item>
          );
        }}
      />
      {!!legend.length && (
        <Typography.Title heading={6}>Legend</Typography.Title>
      )}
      <table>
        <tbody>
          {legend
            .filter((item) => item.if)
            .map((item) => (
              <tr key={item.label}>
                <td>{item.icon}</td>
                <td>=</td>
                <td>{item.label}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <Typography.Title heading={6}>Settings</Typography.Title>
      <Switch
        checkedIcon={<IconCheck />}
        checked={settings.showConnectingRoutes ?? false}
        onChange={(newValue) =>
          setSettings((c) => ({ ...c, showConnectingRoutes: newValue }))
        }
      />{' '}
      Show connecting routes
    </div>
  );
};
