import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Plane, LogOut, Menu, X } from "lucide-react";

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
    <header className="border-b border-navy/10 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" data-testid="nav-logo">
          <span className="h-9 w-9 rounded-lg bg-navy text-white grid place-items-center">
            <Plane className="h-4 w-4 -rotate-12" strokeWidth={2} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-[17px] font-semibold tracking-tight text-navy">
              Wanderlust
            </span>
            <span className="text-[10px] tracking-[0.22em] uppercase text-gold-ink -mt-0.5">
              Adventure
            </span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {PUBLIC_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? "text-navy font-medium"
                    : "text-ink-600 hover:text-navy"
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
                className="hidden sm:inline-flex items-center gap-2 text-sm rounded-lg bg-navy hover:bg-navy-hover text-white px-4 py-2 font-medium transition-colors"
                data-testid="nav-mytrips-link"
              >
                My Trips
              </Link>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-ink-100 text-ink-500 hover:text-navy transition-colors"
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
                className="hidden sm:inline-flex text-sm rounded-lg px-3 py-2 hover:bg-ink-100 text-ink-600 transition-colors"
                data-testid="nav-login-link"
              >
                Log in
              </Link>
              <Link
                to="/contact"
                className="hidden sm:inline-flex text-sm rounded-lg border border-navy/20 text-navy hover:bg-navy-soft px-4 py-2 font-medium transition-colors"
                data-testid="nav-consult-link"
              >
                Free Consultation
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 text-sm rounded-lg bg-navy hover:bg-navy-hover text-white px-4 py-2 font-medium transition-colors"
                data-testid="nav-signup-link"
              >
                Plan My Trip
              </Link>
            </>
          )}
          <button
            className="lg:hidden p-2 rounded-lg text-navy hover:bg-ink-100"
            onClick={() => setOpen(!open)}
            aria-label="menu"
            data-testid="nav-mobile-toggle"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-navy/10 bg-white" data-testid="nav-mobile-menu">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {PUBLIC_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 text-sm rounded-md ${
                    isActive ? "bg-navy-soft text-navy font-medium" : "text-ink-700 hover:bg-ink-100"
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
                className="px-3 py-2.5 text-sm rounded-md bg-navy text-white font-medium text-center mt-2"
              >
                My Trips
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm rounded-md hover:bg-ink-100 text-ink-700"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm rounded-md bg-navy text-white font-medium text-center"
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
