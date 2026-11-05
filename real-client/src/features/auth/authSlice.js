import {createSlice, isAnyOf} from "@reduxjs/toolkit"
import { loginUser, logoutUser, refreshUser, registerUser } from "../../actions/authAction"

export const authSlice = createSlice({
    name: "auth",
    initialState:{
        user: null,
        accessToken: null,
        status: "checking",
        error: null
    },
    reducers:{
        setSession: (state, action) => {
            state.user = action.payload.user
            state.accessToken = action.payload.accessToken
            state.status = "authenticated"
            state.error = null
        },
        clearSeesion: (state) => {
            state.user = null
            state.accessToken = null
            state.status = "guest"
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
        .addMatcher(
            isAnyOf(
                loginUser.pending, 
                registerUser.pending, 
                refreshUser.pending), 
            (state) => {
                state.status = "checking"
                state.error = null
            }
        )
        .addMatcher(
            isAnyOf(loginUser.fulfilled, 
                registerUser.fulfilled, 
                refreshUser.fulfilled), 
            (state, action) => {
                state.user = action.payload.user
                state.accessToken = action.payload.accessToken
                state.status = "authenticated"
                state.error = null
            }
        )
        .addMatcher(
            isAnyOf(loginUser.rejected, 
                registerUser.rejected,
                refreshUser.rejected, 
                logoutUser.fulfilled),
            (state, action) => {
                state.user = null
                state.accessToken = null
                state.status = "guest"
                state.error = logoutUser.fulfilled.match(action) ? null : action.payload || action.error?.message || null
            }
        )
    }
})

export const {setSession, clearSeesion} = authSlice.actions
export default authSlice.reducer