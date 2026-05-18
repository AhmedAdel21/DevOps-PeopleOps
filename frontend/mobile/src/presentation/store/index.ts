import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  authReducer,
  attendanceReducer,
  leaveReducer,
  meReducer,
  teamReducer,
} from './slices';

const rootReducer = combineReducers({
  auth: authReducer,
  attendance: attendanceReducer,
  leave: leaveReducer,
  me: meReducer,
  team: teamReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
