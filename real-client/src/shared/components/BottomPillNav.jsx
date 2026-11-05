import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router";
import {
  ChevronUp,
  Monitor,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "../theme/useTheme";
import LogoutButton from "../../components/LogoutButton";
import { guestRoutes } from "../../routes/guestRoutes";
import { seekerRoutes } from "../../routes/seekerRoutes";
import { providerRoutes } from "../../routes/providerRoutes";
import "./BottomPillNav.css";

const routeMap = {
  guest: guestRoutes,
  seeker: seekerRoutes,
  provider: providerRoutes,
};

function getNavItems(routes = []) {
  // Keep route order: the first three links live on the pill, the rest in More.
  const items = routes.filter((route) => route?.nav).map((route) => ({
    label: route.nav.label,
    to: route.nav.to || (route.path ? `/${route.path}` : "/"),
    icon: route.nav.icon,
  }));

  return { primary: items.slice(0, 3), overflow: items.slice(3) };
}

const themeOptions = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "auto", label: "Auto", icon: Monitor },
];

// Room for the label plus the icon; the pill grows by the same amount.
function revealWidth(label) {
  return Math.max(82, 58 + label.length * 7);
}

function BottomPillNav() {
  const { user, status } = useSelector((state) => state.auth);
  const audience = status === "authenticated" && user?.role === "provider"
    ? "provider"
    : status === "authenticated" && user?.role === "seeker"
      ? "seeker"
      : "guest";
  const { primary, overflow } = getNavItems(routeMap[audience]);
  const menuRows = overflow.length + (audience === "guest" ? 0 : 1);
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => window.scrollY > 20);
  const [revealedLabel, setRevealedLabel] = useState(null);
  const shellRef = useRef(null);
  const toggleRef = useRef(null);
  const firstThemeRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!shellRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => toggleRef.current?.focus());
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function openMenu() {
    setRevealedLabel(null);
    setOpen(true);
    requestAnimationFrame(() => firstThemeRef.current?.focus());
  }

  function moveGlassHighlight(event) {
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    shellRef.current.style.setProperty("--glass-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    shellRef.current.style.setProperty("--glass-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <nav
      ref={shellRef}
      aria-label="Quick navigation"
      className={`bottom-pill${open ? " is-open" : ""}${scrolled ? " is-scrolled" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setRevealedLabel(null);
      }}
      onMouseLeave={() => setRevealedLabel(null)}
      onPointerMove={moveGlassHighlight}
      style={{
        "--pill-closed-width": `${primary.length * 48 + 62}px`,
        "--pill-hover-extra": `${revealedLabel ? revealWidth(revealedLabel) - 44 : 0}px`,
        "--pill-open-height": `${56 + (menuRows ? 10 + menuRows * 48 : 0)}px`,
      }}
    >
      {!open ? (
        <div className="pill-icons">
          {primary.map(({ label, to, icon: Icon }) => {
            const itemProps = {
              "aria-label": label,
              onFocus: () => setRevealedLabel(label),
              onMouseEnter: () => setRevealedLabel(label),
              style: { "--item-reveal-width": `${revealWidth(label)}px` },
            };
            const content = <>
              <span className="pill-glyph"><Icon aria-hidden="true" size={19} strokeWidth={1.9} /></span>
              <span aria-hidden="true" className="pill-icon-label">{label}</span>
            </>;

            return (
              <NavLink
                key={to}
                className={({ isActive }) => `pill-icon-link${isActive ? " is-active" : ""}${revealedLabel === label ? " is-revealed" : ""}`}
                end={to === "/"}
                onClick={() => setRevealedLabel(null)}
                to={to}
                {...itemProps}
              >{content}</NavLink>
            );
          })}
          <button
            ref={toggleRef}
            aria-label="Open navigation menu"
            className={`pill-icon-link pill-toggle${revealedLabel === "More" ? " is-revealed" : ""}`}
            onFocus={() => setRevealedLabel("More")}
            onMouseEnter={() => setRevealedLabel("More")}
            onClick={openMenu}
            style={{ "--item-reveal-width": `${revealWidth("More")}px` }}
            type="button"
          >
            <span className="pill-glyph"><ChevronUp aria-hidden="true" size={19} strokeWidth={1.9} /></span>
            <span aria-hidden="true" className="pill-icon-label">More</span>
          </button>
        </div>
      ) : (
        <div id="pill-expanded-menu" className="pill-panel">
          <div className="pill-panel-top">
            <div aria-label="Color theme" className="pill-theme-options" role="group">
              {themeOptions.map(({ value, label, icon: Icon }, index) => (
                <button
                  key={value}
                  ref={index === 0 ? firstThemeRef : undefined}
                  aria-pressed={mode === value}
                  className={`pill-theme-option${mode === value ? " is-selected" : ""}`}
                  onClick={() => setMode(value)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={15} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <button aria-label="Close navigation menu" className="pill-close" onClick={closeMenu} type="button">
              <X aria-hidden="true" size={17} />
            </button>
          </div>

          {menuRows > 0 && (
            <div className="pill-menu-rows">
              {overflow.map(({ label, to, icon: Icon }) => (
                <NavLink key={to} className="pill-menu-row" end={to === "/"} onClick={closeMenu} to={to}>
                  <Icon aria-hidden="true" size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
              {audience !== "guest" && <div className="pill-logout"><LogoutButton /></div>}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default BottomPillNav;
