import { beforeEach, describe, expect, it, vi } from "vitest";
import reducer, { clearSeesion, setSession } from "../src/features/auth/authSlice.js";
import { loginUser, logoutUser, refreshUser, registerUser } from "../src/actions/authAction.js";
import { store } from "../src/app/store.js";
import { ensureSession } from "../src/services/ensureSession.js";
import api from "../src/api/axiosInstence.js";
import axios from "axios";

vi.mock("../src/api/axiosInstence.js", () => ({ default: { get: vi.fn() } }));
vi.mock("axios", () => ({ default: { post: vi.fn() } }));

const user = { id: "507f1f77bcf86cd799439011", name: "Fixture", role: "seeker" };
const session = { user, accessToken: "fixture-access" };
const response = { data: { data: session } };

beforeEach(() => {
  store.dispatch(clearSeesion());
  vi.clearAllMocks();
});

describe("auth state", () => {
  it("successful authentication sets the user and token", () => {
    const state = reducer(undefined, loginUser.fulfilled(session, "request", {}));
    expect(state).toEqual({ ...session, status: "authenticated", error: null });
  });

  it.each([loginUser, registerUser, refreshUser])("pending auth clears stale errors", action => {
    const state = reducer({ ...session, status: "authenticated", error: "old failure" }, action.pending("request"));
    expect(state.status).toBe("checking"); expect(state.error).toBeNull();
  });

  it("rejected auth removes stale credentials", () => {
    const state = reducer({ ...session, status: "authenticated", error: null }, loginUser.rejected(null, "request", {}, "Invalid credentials"));
    expect(state).toEqual({ user: null, accessToken: null, status: "guest", error: "Invalid credentials" });
  });

  it("successful logout never stores the response object as a renderable error", () => {
    const state = reducer({ ...session, status: "authenticated", error: "old" }, logoutUser.fulfilled({ message: "Signed out" }, "request"));
    expect(state).toEqual({ user: null, accessToken: null, status: "guest", error: null });
  });
});

describe("session recovery", () => {
  it("restores a cookie-backed session without an access token", async () => {
    axios.post.mockResolvedValue(response);
    expect(await ensureSession()).toEqual(user);
    expect(axios.post).toHaveBeenCalledWith("/api/auth/refresh", {}, { withCredentials: true });
    expect(store.getState().auth.accessToken).toBe(session.accessToken);
  });

  it("falls back to refresh when /me returns 401", async () => {
    store.dispatch(setSession({ ...session, accessToken: "expired" }));
    api.get.mockRejectedValue({ response: { status: 401 } });
    axios.post.mockResolvedValue(response);
    expect(await ensureSession()).toEqual(user);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.accessToken).toBe(session.accessToken);
  });

  it("surfaces a database/network failure without discarding the current session", async () => {
    store.dispatch(setSession(session));
    const error = { response: { status: 503 } };
    api.get.mockRejectedValue(error);
    await expect(ensureSession()).rejects.toBe(error);
    expect(axios.post).not.toHaveBeenCalled();
    expect(store.getState().auth.user).toEqual(user);
  });

  it("deduplicates concurrent session checks", async () => {
    store.dispatch(setSession(session));
    const deferred = Promise.withResolvers();
    api.get.mockReturnValue(deferred.promise);
    const first = ensureSession(); const second = ensureSession();
    expect(first).toBe(second);
    deferred.resolve({ data: { data: { user } } });
    expect(await first).toEqual(user);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("a failed refresh becomes a guest session", async () => {
    axios.post.mockRejectedValue({ response: { status: 401, data: { message: "Invalid refresh token" } } });
    expect(await ensureSession()).toBeNull();
    expect(store.getState().auth.status).toBe("guest");
    expect(store.getState().auth.accessToken).toBeNull();
  });
});
