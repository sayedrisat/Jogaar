import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { loginUser } from "../actions/authAction";
import AuthDialog from "../features/auth/components/AuthDialog";

const Login = () => {

  const dispatch = useDispatch()

  const navigate = useNavigate()

  const error = useSelector((state) => state.auth.error);
  const close = useCallback(() => navigate("/", { replace: true }), [navigate]);
  const switchMode = useCallback(() => navigate("/join"), [navigate]);

  const loginSubmit = async (formData) => {
  try {
    const result = await dispatch(loginUser(formData)).unwrap();

    if (result.user.role === "provider") {
      navigate("/provider/dashboard", { replace: true });
    } else if (result.user.role === "seeker") {
      navigate("/seeker", { replace: true });
    }
  } catch (error) {
    console.error("Login failed:", error);
  }
};


  return (
    <AuthDialog
      authError={error}
      mode="sign-in"
      onClose={close}
      onSubmit={loginSubmit}
      onSwitchMode={switchMode}
    />
  )
}

export default Login
