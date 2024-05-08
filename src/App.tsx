import { useEffect, useState } from 'react';
import Timeago from 'react-timeago-i18n';
import { Avatar, Select } from '@arco-design/web-react';
import { useData } from './useData';
import type { Data, Station } from './types.def';
import './main.css';
import { RenderDiagram } from './components/RenderDiagram';
import { RouterContext } from './context';

const empty = <div style={{ padding: '2px 8px' }}>No results</div>;

const Router: React.FC<{
  station: Station | undefined;
  data: Data;
}> = ({ data, station }) => {
  if (!station) return null;

  return (
    <>
      The best carriages are shown in{' '}
      <strong className="green-preview">green</strong>.
      {typeof station.fareGates === 'boolean' && (
        <>
          <br />
          This station{' '}
          {station.fareGates ? (
            <strong>has</strong>
          ) : (
            <>
              does <strong>not</strong> have
            </>
          )}{' '}
          fare gates.
        </>
      )}
      {station.stops.map((stop) => (
        <section key={stop.nodeId}>
          <RenderDiagram data={data} station={station} stop={stop} />
        </section>
      ))}
    </>
  );
};

export const App: React.FC = () => {
  const [data, error] = useData();
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedId, setSelectedId] = useState(
    window.location.hash.slice(1) || '',
  );

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

  useEffect(() => {
    window.history.pushState(null, '', selectedId ? `#${selectedId}` : '#');
  }, [selectedId]);

  if (error) return <>Failed to download data :(</>;
  if (!data) return <>Loading…</>;
  console.log('data', data);

  return (
    <main style={{ margin: 16 }}>
      <Select
        value={selectedNetwork}
        onChange={(newValue) => {
          setSelectedId('');
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
        onChange={(newValue) => setSelectedId(newValue)}
        style={{ marginTop: 8 }}
        notFoundContent={empty}
      >
        <Select.Option value="">Choose a station</Select.Option>
        {data.stations
          .filter((station) => station.networks.includes(selectedNetwork))
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
        <RouterContext.Provider value={setSelectedId}>
          <Router
            data={data}
            station={data.stations.find((s) => s.gtfsId === selectedId)}
          />
        </RouterContext.Provider>
      )}
      <br />
      <br />
      <br />
      <br />
      <hr />
      Last updated: <Timeago date={data.lastUpdated} hideSeconds />.
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
