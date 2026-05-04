import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Compass, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="border-b border-ink-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2" data-testid="nav-logo">
          <span className="h-8 w-8 rounded-lg bg-terracotta text-white grid place-items-center">
            <Compass className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Itinera</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {user && user !== false ? (
            <>
              <span className="hidden sm:block text-sm text-ink-500" data-testid="nav-user-email">
                {user.email}
              </span>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 text-sm rounded-lg px-3 py-2 hover:bg-ink-100 text-ink-600 transition-colors"
                data-testid="nav-logout-btn"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm rounded-lg px-3 py-2 hover:bg-ink-100 text-ink-600 transition-colors"
                data-testid="nav-login-link"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="text-sm rounded-lg bg-terracotta hover:bg-terracotta-hover text-white px-4 py-2 font-medium transition-colors"
                data-testid="nav-signup-link"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
