
import { useSelector } from "react-redux";
import { Link } from "react-router";
import LogoutButton from "./LogoutButton";

const Navbar = () => {
  const { user, status } = useSelector((state) => state.auth);

  return (
    <nav>
      <Link to={user?.role === "provider" ? "/provider/dashboard" : "/seeker"}>
        Marketplace
      </Link>

      {status === "authenticated" && (
        <>
          <span>Welcome, {user?.name}</span>
          <LogoutButton />
        </>
      )}
    </nav>
  );
};

export default Navbar;
