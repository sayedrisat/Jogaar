import {store} from "../app/store"
import api from "../api/axiosInstence"
import { setSession } from "../features/auth/authSlice";
import { refreshUser } from "../actions/authAction";


let sessionPromise = null;

export const ensureSession = () => {
    if(sessionPromise){
        return sessionPromise
    }

    // CASE 1: Access token exists
    sessionPromise = (async () => {
        const token = store.getState().auth.accessToken

        if(token){
            try {
                const {data} = await api.get("/auth/me")

                const user = data.data?.user

                store.dispatch(setSession({user, accessToken: token}))

                return user;

            } catch (error) {
                if(error.response?.status === 401){
                    throw error;
                }
            }
        }

         // CASE 2: No token or expired token
            const result = await store.dispatch(refreshUser())

            if(refreshUser.fulfilled.match(result)){
                return result.payload.user
            }

            return null;
    })().finally(() => {
        sessionPromise = null;
    })

    return sessionPromise;
}