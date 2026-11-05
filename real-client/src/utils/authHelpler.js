export const authHelper = (data, rejectWithValue) => {
    const accessToken = data?.data?.accessToken

        if(!accessToken){
            return rejectWithValue("AccessToken not found")
        }
        
        const user = data?.data?.user
       
        if(!["seeker", "provider"].includes(user?.role)){
            return rejectWithValue("invalid user role")
        }


        return {accessToken, user}
}