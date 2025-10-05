import { useSelector, useDispatch } from 'react-redux';
import { RootState, User } from '../store/types';
import { logout } from '../store/slices/userSlice';

interface AuthState {
  user: User | null;
  role: string | null;
  loading: boolean;
  logout: () => void;
}

const useAuth = (): AuthState => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);

  return {
    user,
    role: user?.role || null,
    loading: false,
    logout: () => dispatch(logout())
  };
};

export default useAuth; 