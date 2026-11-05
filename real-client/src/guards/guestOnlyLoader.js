import { redirect } from "react-router";
import { ensureSession } from "../services/ensureSession"

export const guestOnlyLoader = async () => {
    const user = await ensureSession()

    if(!user){
        return null;
    }

    // if user already loggedin
    if(user.role === "provider"){
        return redirect("/provider/dashboard")
    }

    if(user.role === "seeker"){
        return redirect("/seeker")
    }

    return null;
}