'use client';

import { create } from 'zustand';

interface SearchState {
  keyword: string;
  setKeyword: (keyword: string) => void;
  clearKeyword: () => void;

  // 검색 히스토리 (로컬 스토리지와 동기화)
  history: string[];
  addToHistory: (keyword: string) => void;
  clearHistory: () => void;

  // 정렬 옵션
  sortOption: 'name' | 'distance' | 'rating';
  setSortOption: (option: 'name' | 'distance' | 'rating') => void;
}

const MAX_HISTORY_SIZE = 10;

export const useSearchStore = create<SearchState>((set) => ({
  keyword: '',
  setKeyword: (keyword) => set({ keyword }),
  clearKeyword: () => set({ keyword: '' }),

  history: [],
  addToHistory: (keyword) =>
    set((state) => {
      const trimmed = keyword.trim();
      if (!trimmed) return state;

      const newHistory = [
        trimmed,
        ...state.history.filter((h) => h !== trimmed),
      ].slice(0, MAX_HISTORY_SIZE);

      // 로컬 스토리지에 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('search-history', JSON.stringify(newHistory));
      }

      return { history: newHistory };
    }),
  clearHistory: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('search-history');
    }
    set({ history: [] });
  },

  sortOption: 'name',
  setSortOption: (option) => set({ sortOption: option }),
}));

// 로컬 스토리지에서 검색 히스토리 로드 (초기화)
if (typeof window !== 'undefined') {
  const savedHistory = localStorage.getItem('search-history');
  if (savedHistory) {
    try {
      const parsed = JSON.parse(savedHistory) as string[];
      useSearchStore.setState({ history: parsed });
    } catch {
      // 파싱 실패 시 무시
    }
  }
}
