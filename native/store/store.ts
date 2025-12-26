import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-named-as-default
import newsSlice from '../features/newsSlice';
import settingsSlice from '../features/settingsSlice';

export const store = configureStore({
  reducer: {
    news: newsSlice,
    settings: settingsSlice,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
