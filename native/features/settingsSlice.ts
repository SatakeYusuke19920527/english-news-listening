import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store/store';
import { CefrLevel, NewsSource } from '../types/type';

type SettingsState = {
  level: CefrLevel;
  notificationsEnabled: boolean;
  newsSources: Record<NewsSource, boolean>;
};

const initialState: SettingsState = {
  level: 'B1',
  notificationsEnabled: false,
  newsSources: {
    Google: true,
    OpenAI: true,
    Anthropic: true,
    'Mistral AI': true,
    Microsoft: true,
    AWS: true,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLevel(state, action: PayloadAction<CefrLevel>) {
      state.level = action.payload;
    },
    setNotificationsEnabled(state, action: PayloadAction<boolean>) {
      state.notificationsEnabled = action.payload;
    },
    setNewsSources(state, action: PayloadAction<Record<NewsSource, boolean>>) {
      state.newsSources = { ...state.newsSources, ...action.payload };
    },
    setNewsSourceEnabled(
      state,
      action: PayloadAction<{ source: NewsSource; enabled: boolean }>
    ) {
      state.newsSources[action.payload.source] = action.payload.enabled;
    },
  },
});

export const {
  setLevel,
  setNotificationsEnabled,
  setNewsSourceEnabled,
  setNewsSources,
} = settingsSlice.actions;
export const selectLevel = (state: RootState) => state.settings.level;
export const selectNotificationsEnabled = (state: RootState) =>
  state.settings.notificationsEnabled;
export const selectNewsSources = (state: RootState) =>
  state.settings.newsSources;

export default settingsSlice.reducer;
