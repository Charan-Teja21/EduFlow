import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, UserState } from '../types';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const initialState: UserState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isLoading: false,
};

// Async thunk to fetch user profile from Firestore
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (userId: string) => {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return { id: userDocSnap.id, ...userData } as User;
    } else {
      throw new Error("User profile not found in Firestore.");
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login(state, action: PayloadAction<User>) {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
      state.isLoading = false;
    },
    logout(state) {
      state.user = null;
      localStorage.removeItem('user');
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
        state.isLoading = false;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        console.error("Failed to fetch user profile:", action.error);
        state.user = null;
        localStorage.removeItem('user');
        state.isLoading = false;
      });
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer; 