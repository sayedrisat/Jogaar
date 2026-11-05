import { ensureSession } from "../services/ensureSession"


export const rootLoader = async () => {

    const user = ensureSession();

    return user;
}