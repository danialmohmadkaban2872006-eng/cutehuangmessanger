// © Danial Mohmad — All Rights Reserved
<<<<<<< HEAD
import supabase from "../lib/supabase";
import { mapProfile } from "../lib/mappers";
import type { AuthResponse, User } from "../types";

export const authService = {
  /**
   * Create a new account.
   * Supabase sends a confirmation email by default — disable that in
   * Supabase Dashboard → Auth → Settings → "Enable email confirmations" = OFF for dev.
   */
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { displayName },    // passed to raw_user_meta_data, used by trigger
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        throw Object.assign(new Error("Email already registered"), { code: "EMAIL_TAKEN" });
      }
      throw error;
    }

    if (!data.session) {
      // Email confirmation required — inform the caller
      throw Object.assign(
        new Error("Please confirm your email before logging in."),
        { code: "EMAIL_CONFIRMATION_REQUIRED" }
      );
    }

    // Fetch the auto-created profile (may take a moment for trigger to run)
    const profile = await authService._fetchProfile(data.user!.id);

    return {
      user: profile,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw Object.assign(new Error("Invalid email or password"), {
        code: "INVALID_CREDENTIALS",
      });
    }

    const profile = await authService._fetchProfile(data.user.id);

    return {
      user: profile,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  /**
   * Fetch the current session from Supabase local storage.
   * Returns null if no session exists.
   */
  async me(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return authService._fetchProfile(session.user.id);
  },

  /** Fetch profile row. Retries once to handle trigger latency on first signup. */
  async _fetchProfile(userId: string): Promise<User> {
    let { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Trigger might not have run yet on very first signup — retry after short delay
    if (!data && !error) {
      await new Promise(r => setTimeout(r, 800));
      ({ data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single());
    }

    if (error || !data) throw new Error("Profile not found");
    return mapProfile(data);
=======
import api from "./api";
import type { AuthResponse, User } from "../types";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data;
  },

  async register(email: string, password: string, displayName: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", { email, password, displayName });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
  },
};
