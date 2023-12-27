import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { thunk } from 'redux-thunk';

import orders from '../redux/slices/orders/ordersSlices';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['ordersState'],
};

const rootReducer = combineReducers({
  ordersState: orders,
  // ACA VAN LOS ESTADOS
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(thunk),
});

export default store;
