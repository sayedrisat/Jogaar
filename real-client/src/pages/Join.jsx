import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {useNavigate} from "react-router"
import { registerUser} from "../actions/authAction"
import AuthDialog from "../features/auth/components/AuthDialog";

const Join = () => {

  const dispatch = useDispatch()

  const navigate = useNavigate()

  const error = useSelector((state) => state.auth.error);
  const close = useCallback(() => navigate("/", { replace: true }), [navigate]);
  const switchMode = useCallback(() => navigate("/login"), [navigate]);

  const registerSubmit = async (formData) => {
  try {
    const result = await dispatch(registerUser(formData)).unwrap();

    if (result.user.role === "provider") {
      navigate("/provider/dashboard", { replace: true });
    } else if (result.user.role === "seeker") {
      navigate("/seeker", { replace: true });
    }
  } catch (error) {
    console.error("Register failed:", error);
  }
};


  return (
    <AuthDialog
      authError={error}
      mode="sign-up"
      onClose={close}
      onSubmit={registerSubmit}
      onSwitchMode={switchMode}
    />
  )
}

export default Join
