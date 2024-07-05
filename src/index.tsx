import { RouterProvider, createHashRouter } from 'react-router-dom';
import { DataWrapper } from './context/data';
import { SettingsWrapper } from './context/settings';
import { Home } from './App';
import { RoutesByNetwork } from './pages/RoutesByNetwork';
import { RoutesByShield } from './pages/RoutesByShield';
import { RoutesInfo } from './pages/RoutesInfo';
import { RoutesNetworks } from './pages/RoutesNetworks';

const router = createHashRouter([
  { path: '/', element: <Home /> },
  { path: '/:stationId', element: <Home /> },
  { path: '/routes', element: <RoutesNetworks /> },
  { path: '/routes/:qId', element: <RoutesByNetwork /> },
  { path: '/routes/:qId/:shieldKey', element: <RoutesByShield /> },
  { path: '/routes/:qId/:shieldKey/:relationId', element: <RoutesInfo /> },
]);

export const App: React.FC = () => (
  <SettingsWrapper>
    <DataWrapper>
      <RouterProvider router={router} />
    </DataWrapper>
  </SettingsWrapper>
);
