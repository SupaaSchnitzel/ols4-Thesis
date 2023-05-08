import { configureStore } from "@reduxjs/toolkit";
import homeReducer from "../pages/home/homeSlice";
import ontologiesReducer from "../pages/ontologies/ontologiesSlice";
import searchReducer from '../pages/search/searchSlice';
import filterReducer from '../components/FilterSlice'
export const store = configureStore({
  reducer: {
    home: homeReducer,
    search: searchReducer,
    ontologies: ontologiesReducer,
    // Added reducer for the filter functionality
    filter: filterReducer,
    
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
