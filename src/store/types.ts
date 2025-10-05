export interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  mentorId?: string | null;
  [key: string]: any; // Allow for other properties
}

export interface UserState {
  user: User | null;
  isLoading: boolean; // Add loading state for user-related operations
}

export interface RootState {
  user: UserState;
} 