import { useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, List, Typography } from '@arco-design/web-react';
import { DataContext } from '../context/data';
import { RouteShield } from '../components/RouteShield';

export const RoutesByShield: React.FC = () => {
  const data = useContext(DataContext);
  const qId = useParams().qId!;
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
      </Typography.Title>
      <List
        dataSource={Object.entries(route.variants)}
        render={([key, value]) => {
          return (
            <List.Item key={key}>
              <Link to={`/routes/${qId}/${shieldKey}/${key}`}>
                <Button type="text">
                  {value.from} to {value.to}
                  {value.via && ` via ${value.via}`}
                </Button>
              </Link>
            </List.Item>
          );
        }}
      />
    </div>
  );
};
