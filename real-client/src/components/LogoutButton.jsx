
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { logoutUser } from "../actions/authAction";

export default function LogoutButton() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    setLoading(true);
    setError("");

    try {
      await dispatch(logoutUser()).unwrap();

      navigate("/", { replace: true });
    } catch (err) {
      setError(
        typeof err === "string" ? err : "Logout failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleLogout} disabled={loading}>
        {loading ? "Logging out..." : "Logout"}
      </button>

      {error && <p role="alert">{error}</p>}
    </div>
  );
}
