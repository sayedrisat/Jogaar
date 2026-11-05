import { useNavigate } from "react-router";
import { useSelector } from "react-redux";

const Home = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  return (
    <section className="app-card hero-card home-hero">
      <div className="home-hero-content">
        <p className="brand-kicker">WELCOME TO JOGAAR</p>
        <h1>Find the right service for your next project.</h1>
        <p className="app-muted">Explore services and connect with providers in one place.</p>
        {!user && (
          <div className="home-actions">
            <button className="primary-button" onClick={() => navigate("/join")} type="button">Join Jogaar</button>
            <button className="home-text-button" onClick={() => navigate("/login")} type="button">Sign in</button>
          </div>
        )}
      </div>
      <div aria-hidden="true" className="home-hero-art">
        <img alt="" src="/Jogaar_Icon.svg" />
      </div>
    </section>
  );
};

export default Home;
