import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { socketMiddleware } from './middleware/socketMiddleware';

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/connect'],
      },
    }).concat(socketMiddleware),
  devTools: __DEV__,
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;
