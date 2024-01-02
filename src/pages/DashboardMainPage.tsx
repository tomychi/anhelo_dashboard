import { Routes, Route } from 'react-router-dom';
import { Sidebar } from '../components/sidebar';
import {
  DynamicForm,
  Comandera,
  Delivery,
  MapStats,
  Settings,
  Dashboard,
} from '../pages';

export const DashboardMainPage = () => {
  return (
    <div className="flex h-screen bg-black overflow-x-hidden">
      <Sidebar />
      <div className="flex-grow overflow-y-auto">
        <Routes>
          {/* Agrega un comodín '*' a la ruta principal */}
          <Route path="/*">
            <Route index element={<Dashboard />} />
            <Route path="pedidos" element={<DynamicForm />} />
            <Route path="comandas" element={<Comandera />} />
            <Route path="delivery" element={<Delivery />} />
            <Route path="map" element={<MapStats />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
};
