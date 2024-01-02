import { HashRouter, Route, Routes } from 'react-router-dom';
import {
  Comandera,
  Dashboard,
  Delivery,
  DynamicForm,
  MapStats,
  Settings,
} from '../pages';
import { Sidebar } from '../components/sidebar';
import { Authentication } from '../pages/Authentication';
import { Error } from '../pages/Error';
import { PrivateRoutesLayout } from '../layouts/PrivateRoutesLayout';

export const Navigation = () => {
  return (
    <HashRouter>
      <div className="flex h-screen bg-black overflow-x-hidden">
        {/* Contenedor principal con display flex */}

        <Sidebar />
        <div className="flex-grow overflow-y-auto">
          {/* Este div se expandirá para ocupar el espacio restante y permitirá el scroll */}
          <Routes>
            {/* public route */}
            <Route path="/authentication" element={<Authentication />} />

            {/* private route */}
            <Route element={<PrivateRoutesLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pedidos" element={<DynamicForm />} />
              <Route path="/comandas" element={<Comandera />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/map" element={<MapStats />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Error />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
};
