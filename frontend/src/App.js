import React from "react";
import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Destinations from "@/pages/Destinations";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import ItineraryDetail from "@/pages/ItineraryDetail";
import WhatsAppFab from "@/components/WhatsAppFab";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="App">
      <HelmetProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/itinerary/:id"
                element={
                  <ProtectedRoute>
                    <ItineraryDetail />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <WhatsAppFab />
            <Toaster position="top-right" richColors closeButton />
          </BrowserRouter>
        </AuthProvider>
      </HelmetProvider>
    </div>
  );
}

export default App;
