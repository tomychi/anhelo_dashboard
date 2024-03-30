import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'mapbox-gl/dist/mapbox-gl.css';
import './index.css';
import './firebase/config';
import { Provider } from 'react-redux';
import store from './redux/configureStore';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore, Persistor } from 'redux-persist';
import mapboxgl from 'mapbox-gl';

const accessToken = import.meta.env.VITE_ACCESS_TOKEN;
mapboxgl.accessToken = accessToken;

const persistor: Persistor = persistStore(store);
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistGate persistor={persistor}>
      <Provider store={store}>
        <App />
      </Provider>
    </PersistGate>
  </React.StrictMode>
);
