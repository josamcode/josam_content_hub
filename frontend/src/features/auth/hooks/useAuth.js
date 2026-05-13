import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getAuthToken,
  setAuthToken,
  setUnauthorizedHandler,
} from "../../../lib/axios";
import { fetchCurrentUser, loginRequest } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const unauthorizedCallbackRef = useRef(null);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
    if (typeof unauthorizedCallbackRef.current === "function") {
      unauthorizedCallbackRef.current();
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchCurrentUser();
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        setAuthToken(null);
        setUser(null);
        setStatus("unauthenticated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const result = await loginRequest({ email, password });
    if (!result?.token) {
      throw new Error("Invalid server response");
    }
    setAuthToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const registerUnauthorizedCallback = useCallback((cb) => {
    unauthorizedCallbackRef.current = cb;
    return () => {
      if (unauthorizedCallbackRef.current === cb) {
        unauthorizedCallbackRef.current = null;
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      login,
      logout,
      registerUnauthorizedCallback,
    }),
    [user, status, login, logout, registerUnauthorizedCallback]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
