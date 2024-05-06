import { Fragment, useEffect, useState } from 'react';
import Timeago from 'react-timeago-i18n';
import { Avatar, Select } from '@arco-design/web-react';
import { useData } from './useData';
import type { Station } from './types.def';
import './main.css';
import { RenderDiagram } from './components/RenderDiagram';
import { RouterContext } from './context';

const Router: React.FC<{
  station: Station | undefined;
}> = ({ station }) => {
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
      {Object.values(station.stops)
        .sort((a, b) => +(a.platform ?? 0) - +(b.platform ?? 0))
        .map((stop) => (
          <section key={stop.nodeId}>
            <RenderDiagram station={station} stop={stop} />
          </section>
        ))}
    </>
  );
};

export const App: React.FC = () => {
  const [data, error, isLoading, refreshData] = useData();
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedId, setSelectedId] = useState(
    window.location.hash.slice(1) || '',
  );

  useEffect(() => {
    // if there is no network, set it to the network of the current stop
    // or default to the first network (alphabetically)
    if (data && !selectedNetwork) {
      setSelectedNetwork(
        selectedId
          ? data.stations[selectedId].networks[0]
          : Object.keys(data.networks)[0],
      );
    }
  }, [data, selectedNetwork, selectedId]);

  useEffect(() => {
    // keep the network in sync if the current station changes
    if (
      data &&
      selectedId &&
      selectedNetwork &&
      !data.stations[selectedId].networks.includes(selectedNetwork)
    ) {
      setSelectedNetwork(data.stations[selectedId].networks[0]);
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
        notFoundContent="No results"
      >
        {selectedNetwork === '' && (
          <Select.Option value="">Choose a network</Select.Option>
        )}
        {Object.entries(data.networks).map(([qId, network]) => (
          <Select.Option key={qId} value={qId}>
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
        notFoundContent="No results"
      >
        <Select.Option value="">Choose a station</Select.Option>
        {Object.values(data.stations)
          .filter((station) => station.networks.includes(selectedNetwork))
          .sort((a, b) => a.name.localeCompare(b.name))
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
          <Router station={data.stations[selectedId]} />
        </RouterContext.Provider>
      )}
      <br />
      <br />
      <br />
      <br />
      <hr />
      Last updated: <Timeago date={data.lastUpdated} hideSeconds />.{' '}
      <button type="button" onClick={refreshData} disabled={isLoading}>
        {isLoading ? 'Loading…' : `Refresh (${data.sizeMb} MB)`}
      </button>
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
