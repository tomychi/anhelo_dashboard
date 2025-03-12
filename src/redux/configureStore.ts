import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { thunk } from "redux-thunk";

import dataReducer, { DataState } from "./data/dataReducer";
import authReducer, { UserState } from "./auth/authReducer";
import productReducer, { ProductState } from "./products/productReducer";
import materialsReducer, { MaterialState } from "./materials/materialReducer";
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "product", "data", "materials"],
};

export interface RootState {
  data: DataState; // Ajusta esto según la estructura de tu estado de pedidos
  auth: UserState; // Ajusta esto según la estructura de tu estado de autenticación
  product: ProductState; // Ajusta esto según la estructura de tu estado de autenticación
  materials: MaterialState;
}

const RootReducer = combineReducers({
  data: dataReducer,
  auth: authReducer,
  product: productReducer,
  materials: materialsReducer,
  // ACA VAN LOS ESTADOS
});

const persistedReducer = persistReducer<any, any>(persistConfig, RootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(thunk),
});

export default store;
// export type RootState = ReturnType<typeof RootReducer>;

// Define el tipo de tu estado global
