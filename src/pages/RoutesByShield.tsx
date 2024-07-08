import { useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, List, Typography } from '@arco-design/web-react';
import type { ItemId } from 'wikibase-sdk';
import { DataContext } from '../context/data';
import { RouteShield } from '../components/RouteShield';
import { TrainsetInfo } from './TrainsetInfo';

export const RoutesByShield: React.FC = () => {
  const data = useContext(DataContext);
  const qId = useParams<{ qId: ItemId }>().qId!;
  const shieldKey = useParams().shieldKey!;

  const network = data.networks.find((n) => n.qId === qId);
  const route = data.routes[qId]?.[shieldKey];

  if (!network || !route) return null;

  return (
    <div className="main">
      <Link to={`/routes/${qId}`}>Back</Link>

      <Typography.Title heading={3} className="verticalCentre">
        <Avatar size={32}>
          <img alt={network.name} src={network.logoUrl} />
        </Avatar>
        <RouteShield route={route.shield} />
        {route.wikidata?.name}
      </Typography.Title>
      {route.wikidata?.trainsets && (
        <TrainsetInfo trainsets={route.wikidata.trainsets} />
      )}
      <List
        dataSource={Object.entries(route.variants)}
        render={([key, value]) => {
          return (
            <List.Item key={key}>
              <Link to={`/routes/${qId}/${shieldKey}/${key}`}>
                <Button type="text">
                  {value.tags.from} to {value.tags.to}
                  {value.tags.via && ` via ${value.tags.via}`}
                </Button>
              </Link>
            </List.Item>
          );
        }}
      />
      <br />
      {route.wikidata && (
        <>
          View on{' '}
          <a
            href={`https://www.wikidata.org/wiki/${route.wikidata.qId}`}
            target="_blank"
            rel="noreferrer"
          >
            Wikidata
          </a>
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
          .
        </>
      )}
    </div>
  );
};
