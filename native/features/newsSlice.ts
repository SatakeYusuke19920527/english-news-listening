import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store/store';
import { CosmosNewsItem } from '../types/type';
import { fetchNewsList } from '../lib/newsApi';

type InitialStateType = {
  news: CosmosNewsItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: InitialStateType = {
  news: [],
  status: 'idle',
  error: null,
};

export const loadNewsList = createAsyncThunk<CosmosNewsItem[], string | undefined>(
  'news/loadNewsList',
  async (userId) => {
    const items = await fetchNewsList(userId);
    return items;
  }
);

export const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadNewsList.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadNewsList.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.news = action.payload;
      })
      .addCase(loadNewsList.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load news';
      });
  },
});

export const selectNews = (state: RootState) => state.news;

export default newsSlice.reducer;
