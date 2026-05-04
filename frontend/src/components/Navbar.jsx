import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Menu, X } from "lucide-react";
import logoImg from "@/assets/logo.svg";

const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/destinations", label: "Destinations" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="border-b border-fog/50 bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center" data-testid="nav-logo">
          <img src={logoImg} alt="Wanderlust Adventure" className="h-24 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {PUBLIC_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-4 py-2 font-label text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors relative ${
                  isActive
                    ? "text-gold after:absolute after:left-4 after:right-4 after:-bottom-[26px] after:h-[2px] after:bg-gold"
                    : "text-charcoal hover:text-ocean"
                }`
              }
              data-testid={`nav-link-${l.label.toLowerCase()}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user && user !== false ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-2 bg-ocean-gradient text-white px-5 py-2.5 rounded-full font-label text-[13px] font-semibold uppercase tracking-wider hover:shadow-float transition-all"
                data-testid="nav-mytrips-link"
              >
                My Trips
              </Link>
              <button
                onClick={onLogout}
                className="p-2 rounded-full hover:bg-sand text-driftwood hover:text-ocean transition-colors"
                data-testid="nav-logout-btn"
                aria-label="logout"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center text-[13px] rounded-full px-4 py-2 hover:bg-sand text-charcoal font-label font-semibold uppercase tracking-wider transition-colors"
                data-testid="nav-login-link"
              >
                Log in
              </Link>
              <Link
                to="/contact"
                className="hidden md:inline-flex items-center text-[13px] rounded-full border-[1.5px] border-ocean text-ocean hover:bg-ocean hover:text-white px-5 py-2 font-label font-semibold uppercase tracking-wider transition-colors"
                data-testid="nav-consult-link"
              >
                Free Consult
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 text-[13px] rounded-full bg-sunset text-charcoal px-5 py-2.5 font-label font-semibold uppercase tracking-wider shadow-lift hover:shadow-float transition-all"
                data-testid="nav-signup-link"
              >
                Plan My Trip
              </Link>
            </>
          )}
          <button
            className="lg:hidden p-2 rounded-lg text-ocean hover:bg-sand"
            onClick={() => setOpen(!open)}
            aria-label="menu"
            data-testid="nav-mobile-toggle"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-fog/50 bg-white" data-testid="nav-mobile-menu">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {PUBLIC_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 font-label text-sm font-semibold rounded-md ${
                    isActive ? "bg-sand text-ocean" : "text-charcoal hover:bg-sand"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user && user !== false ? (
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="px-3 py-3 font-label text-sm font-semibold rounded-full bg-ocean text-white text-center mt-2 uppercase tracking-wider"
              >
                My Trips
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 font-label text-sm font-semibold rounded-md hover:bg-sand text-charcoal"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 font-label text-sm font-semibold rounded-full bg-sunset text-charcoal text-center uppercase tracking-wider"
                >
                  Plan My Trip
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
