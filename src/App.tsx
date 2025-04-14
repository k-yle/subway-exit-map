import { useContext, useEffect, useState } from 'react';
import Timeago from 'react-timeago-i18n';
import { Avatar, Button, Select } from '@arco-design/web-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ItemId } from 'wikibase-sdk';
import { distanceBetween } from '../script/_helpers/geo';
import type { Data, Station } from './types.def';
import { RenderDiagram } from './components/RenderDiagram';
import { Settings } from './components/Settings';
import { DataContext } from './context/data';
import { bold, getName, locale, t } from './i18n';

import './main.css';
import { copyrightFooter } from './components/text';

const empty = (
  <div style={{ padding: '2px 8px' }}>{t('generic.no-results')}</div>
);

const greenPreview = (str: string) => (
  <strong key={0} className="green-preview">
    {str}
  </strong>
);

const MainLayout: React.FC<{
  station: Station | undefined;
  data: Data;
}> = ({ data, station }) => {
  if (!station) return null;

  return (
    <>
      {t('MainLayout.intro', { greenPreview })}
      {station.fareGates &&
        {
          no: (
            <>
              <br />
              {t('MainLayout.fare-gates.no', { bold })}
            </>
          ),
          yes: (
            <>
              <br />
              {t('MainLayout.fare-gates.yes', { bold })}
            </>
          ),
          partial: (
            <>
              <br />
              {t('MainLayout.fare-gates.partial', { bold })}
              {station.fareGatesNote && (
                <>
                  {' '}
                  (
                  <Button
                    type="text"
                    onClick={() =>
                      // eslint-disable-next-line no-alert
                      alert(
                        t('MainLayout.fare-gates-note.alert', {
                          note: station.fareGatesNote,
                        }),
                      )
                    }
                    style={{ padding: 0 }}
                  >
                    {t('MainLayout.fare-gates-note.btn')}
                  </Button>
                  )
                </>
              )}
              .
            </>
          ),
        }[station.fareGates]}
      {station.stops.some((stop) => stop.biDiMode === 'occasional') && (
        <>
          <br />
          <sup>†</sup> = {t('MainLayout.bi-di-occasional')}
        </>
      )}
      {station.stops
        .filter((stop) => stop.carriages.length)
        .map((stop) => (
          <section key={stop.nodeId}>
            <RenderDiagram data={data} station={station} stop={stop} />
          </section>
        ))}
    </>
  );
};

let homePromise: Promise<{ lat: number; lon: number }>;

export const Home: React.FC = () => {
  // TODO: get fromLocalStorage
  const [selectedNetwork, setSelectedNetwork] = useState<ItemId | ''>('');

  const selectedId = useParams().stationId;
  const navigate = useNavigate();

  const data = useContext(DataContext);

  useEffect(() => {
    // if there is no network, set it to the network of the current stop
    // or default to the closest network to the user.
    if (!selectedNetwork) {
      homePromise ||= fetch('https://3.kyle.kiwi').then((r) => r.json());
      if (data) {
        const station = data.stations.find((s) => s.gtfsId === selectedId);
        if (station) {
          setSelectedNetwork(station.networks[0]);
        } else {
          homePromise
            .then((home) => {
              const closest = data.networks
                .map((network) => ({
                  network,
                  distance: distanceBetween(
                    home.lat,
                    home.lon,
                    network.centre.lat,
                    network.centre.lon,
                  ),
                }))
                .sort((a, b) => a.distance - b.distance)[0];
              setSelectedNetwork(closest.network.qId);
            })
            .catch(console.error);
        }
      }
    }
  }, [data, selectedNetwork, selectedId]);

  useEffect(() => {
    // keep the network in sync if the current station changes
    if (data && selectedId && selectedNetwork) {
      const station = data.stations.find((s) => s.gtfsId === selectedId);
      if (station && !station.networks.includes(selectedNetwork)) {
        setSelectedNetwork(station.networks[0]);
      }
    }
  }, [data, selectedNetwork, selectedId]);

  return (
    <main style={{ margin: 16 }}>
      <Select
        value={selectedNetwork}
        onChange={(newValue) => {
          navigate('/', { replace: true });
          setSelectedNetwork(newValue);
        }}
        notFoundContent={empty}
      >
        {selectedNetwork === '' && (
          <Select.Option value="">{t('Home.select-network')}</Select.Option>
        )}
        {data.networks.map((network) => (
          <Select.Option key={network.qId} value={network.qId}>
            {network.logoUrl && (
              <Avatar size={24}>
                <img alt={getName(network.name)} src={network.logoUrl} />
              </Avatar>
            )}
            &nbsp;
            {getName(network.name)}
          </Select.Option>
        ))}
      </Select>
      <Select
        showSearch
        filterOption={(inputValue, option) =>
          option.props['data-name']
            ?.toLowerCase()
            .includes(inputValue.toLowerCase())
        }
        onSearch={(v) => v}
        value={selectedId}
        onChange={(newValue) => navigate(`/${newValue}`, { replace: true })}
        style={{ marginTop: 8 }}
        notFoundContent={empty}
      >
        <Select.Option value="">{t('Home.select-station')}</Select.Option>
        {data.stations
          .filter(
            (station) =>
              selectedNetwork && station.networks.includes(selectedNetwork),
          )
          .map((station) => {
            const name = getName(station.name);
            return (
              <Select.Option
                key={station.gtfsId}
                value={station.gtfsId}
                data-name={name}
              >
                {name}
              </Select.Option>
            );
          })}
      </Select>
      <br />
      {!!selectedId && (
        <MainLayout
          data={data}
          station={data.stations.find((s) => s.gtfsId === selectedId)}
        />
      )}
      <br />
      <br />
      <br />
      <br />
      <hr />
      {t('Home.footer.lastUpdated', {
        relativeTime: (
          <Timeago
            key={0}
            date={data.lastUpdated}
            hideSeconds
            locale={locale}
          />
        ),
      })}
      {' | '}
      <Settings />
      {' | '}
      <Link to="/routes">
        <Button type="text" style={{ padding: 0 }}>
          {t('Menu.view-routes')}
        </Button>
      </Link>
      <br />
      <small>{copyrightFooter}</small>
    </main>
  );
};
