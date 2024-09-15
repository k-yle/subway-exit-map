import { useContext, useEffect, useState } from 'react';
import Timeago from 'react-timeago-i18n';
import { Avatar, Button, Select } from '@arco-design/web-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ItemId } from 'wikibase-sdk';
import type { Data, Station } from './types.def';
import { RenderDiagram } from './components/RenderDiagram';
import { Settings } from './components/Settings';
import { DataContext } from './context/data';

import './main.css';

const empty = <div style={{ padding: '2px 8px' }}>No results</div>;

const MainLayout: React.FC<{
  station: Station | undefined;
  data: Data;
}> = ({ data, station }) => {
  if (!station) return null;

  return (
    <>
      The best carriages are shown in{' '}
      <strong className="green-preview">green</strong>.
      {station.fareGates &&
        {
          no: (
            <>
              <br />
              This station does <strong>not</strong> have fare gates.
            </>
          ),
          yes: (
            <>
              <br />
              This station <strong>has</strong> fare gates.
            </>
          ),
          partial: (
            <>
              <br />
              This station has fare gates at <strong>some entrances</strong>
              {station.fareGatesNote && (
                <>
                  {' '}
                  (
                  <Button
                    type="text"
                    // eslint-disable-next-line no-alert
                    onClick={() => alert(`“${station.fareGatesNote}”`)}
                    style={{ padding: 0 }}
                  >
                    click for details
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
          <sup>†</sup> = During disruptions, trains may travel in the opposite
          direction at this platform.
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

export const Home: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<ItemId | ''>('');

  const selectedId = useParams().stationId;
  const navigate = useNavigate();

  const data = useContext(DataContext);

  useEffect(() => {
    // if there is no network, set it to the network of the current stop
    // or default to the first network (alphabetically)
    if (data && !selectedNetwork) {
      const station = data.stations.find((s) => s.gtfsId === selectedId);
      setSelectedNetwork(station ? station.networks[0] : data.networks[0].qId);
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
          <Select.Option value="">Choose a network</Select.Option>
        )}
        {data.networks.map((network) => (
          <Select.Option key={network.qId} value={network.qId}>
            {network.logoUrl && (
              <Avatar size={24}>
                <img alt={network.name} src={network.logoUrl} />
              </Avatar>
            )}
            &nbsp;
            {network.name}
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
        <Select.Option value="">Choose a station</Select.Option>
        {data.stations
          .filter(
            (station) =>
              selectedNetwork && station.networks.includes(selectedNetwork),
          )
          .map((station) => (
            <Select.Option
              key={station.gtfsId}
              value={station.gtfsId}
              data-name={station.name}
            >
              {station.name}
            </Select.Option>
          ))}
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
      Last updated: <Timeago date={data.lastUpdated} hideSeconds />
      {' | '}
      <Settings />
      {' | '}
      <Link to="/routes">
        <Button type="text" style={{ padding: 0 }}>
          View Routes
        </Button>
      </Link>
      <br />
      <small>
        Data copyright &copy;{' '}
        <a href="https://osm.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap contributors
        </a>
        .
      </small>
    </main>
  );
};
