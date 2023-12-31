import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { thunk } from 'redux-thunk';

import orders from '../redux/slices/orders/ordersSlices';
import data from '../redux/slices/data/dataSlice';
import authReducer from './auth/authReducer';
import cart from '../redux/cart/cartSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['ordersState', 'dataState', 'cartState'],
};

const rootReducer = combineReducers({
  ordersState: orders,
  dataState: data,
  auth: authReducer,
  cartState: cart,
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
