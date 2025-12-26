import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store/store';
import { CefrLevel } from '../types/type';

type SettingsState = {
  level: CefrLevel;
};

const initialState: SettingsState = {
  level: 'B1',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLevel(state, action: PayloadAction<CefrLevel>) {
      state.level = action.payload;
    },
  },
});

export const { setLevel } = settingsSlice.actions;
export const selectLevel = (state: RootState) => state.settings.level;

export default settingsSlice.reducer;
