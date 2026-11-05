import axios from "axios"
import {store} from "../app/store"

const api = axios.create({
    baseURL: "/api",
    withCredentials: true
})

api.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken

    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }

    return config;
})

export default api;