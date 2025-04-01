import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
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
  data: DataState;
  auth: UserState;
  product: ProductState;
  materials: MaterialState;
}

// Primero definimos el appReducer (combinación normal de reducers)
const appReducer = combineReducers({
  data: dataReducer,
  auth: authReducer,
  product: productReducer,
  materials: materialsReducer,
});

// Luego definimos nuestro rootReducer con la lógica de reseteo
const rootReducer = (state: any, action: any) => {
  // Cuando ocurre LOGOUT_SUCCESS, limpiamos todo el estado
  if (action.type === "LOGOUT_SUCCESS") {
    // Opcional: limpiar el almacenamiento persistente
    // storage.removeItem('persist:root');

    // Devolvemos el estado inicial llamando a los reducers con state undefined
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

// Persistir el rootReducer modificado
const persistedReducer = persistReducer<any, any>(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(thunk),
});

export default store;
