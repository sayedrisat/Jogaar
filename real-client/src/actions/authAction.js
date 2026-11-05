import {createAsyncThunk} from "@reduxjs/toolkit"
import axios from "axios"
import { authHelper } from "../utils/authHelpler"

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
        // get accessToken and user by credentials
        const {data} = await axios.post("/api/auth/login", credentials)

        return authHelper(data, rejectWithValue)

    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || "Login failed");
        
    }
  })

export const refreshUser = createAsyncThunk("auth/refreshUser", async (_, {rejectWithValue}) => {

    try {
        const {data} = await axios.post("/api/auth/refresh", {}, {
            withCredentials: true
        })
        
        return authHelper(data, rejectWithValue)

    } catch (error) {
        return rejectWithValue(
        error.response?.data?.message ||
        "Session refresh failed"
      ); 
    }
})

export const logoutUser = createAsyncThunk("auth/logout", async (_, {rejectWithValue}) => {
    try {
        const {data} = await axios.post("/api/auth/logout",{}, {
            withCredentials: true
        })

        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Logout failed")
    }
})

export const registerUser = createAsyncThunk("/auth/register", async ({name, email, role, password, confirmPassword}, {rejectWithValue}) => {
   try {
     const {data} = await axios.post("/api/auth/register", {
        name, email, role, password, confirmPassword
    })

    return authHelper(data, rejectWithValue)

   } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || "Account register failed");

   }
})

