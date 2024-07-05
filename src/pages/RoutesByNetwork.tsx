import { useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, List, Typography } from '@arco-design/web-react';
import { DataContext } from '../context/data';
import { RouteShield } from '../components/RouteShield';

export const RoutesByNetwork: React.FC = () => {
  const data = useContext(DataContext);
  const qId = useParams().qId!;

  const network = data.networks.find((n) => n.qId === qId);
  const routes = data.routes[qId];

  if (!network || !routes) return null;

  return (
    <div className="main">
      <Link to="/routes" replace>
        Back
      </Link>

      <Typography.Title heading={3} className="verticalCentre">
        <Avatar size={32}>
          <img alt={network.name} src={network.logoUrl} />
        </Avatar>
        {network.name}
      </Typography.Title>
      <List
        dataSource={Object.entries(routes).sort(([, a], [, b]) =>
          (a.shield.ref || '').localeCompare(b.shield.ref || ''),
        )}
        render={([key, value]) => {
          const desinations = [
            ...new Set(
              Object.values(value.variants).flatMap((x) => [x.from, x.to]),
            ),
          ].sort((a, b) => a.localeCompare(b));
          return (
            <List.Item key={key}>
              <Link to={`/routes/${qId}/${key}`} replace>
                <Button type="text">
                  <RouteShield route={value.shield} />{' '}
                  <div>{desinations.flatMap((x) => [x, <br key={x} />])}</div>
                </Button>
              </Link>
            </List.Item>
          );
        }}
      />
    </div>
  );
};
