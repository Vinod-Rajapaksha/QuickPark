import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authApi } from "../features/auth/api/authApi";
import type {
  LoginCredentials,
  RegisterData,
} from "../features/auth/api/authApi";
import {
  logout,
  setCredentials,
  setLoading,
} from "../app/store/slices/authSlice";
import type { RootState } from "../app/store";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  const checkSession = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const user = await authApi.getCurrentUser();
      dispatch(setCredentials({ user }));
    } catch {
      dispatch(logout());
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loginUser = async (credentials: LoginCredentials) => {
    await authApi.login(credentials);
    await checkSession();
  };

  const registerUser = async (data: RegisterData) => {
    await authApi.register(data);
  };

  const logoutUser = async () => {
    try {
      await authApi.logout();
    } finally {
      dispatch(logout());
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    loginUser,
    registerUser,
    logoutUser,
    checkSession,
  };
};
