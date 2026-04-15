import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { authReducer, attendanceReducer } from './slices';

const rootReducer = combineReducers({
  auth: authReducer,
  attendance: attendanceReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
