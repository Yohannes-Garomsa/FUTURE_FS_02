import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/store";
import { usersAPI } from "./services/api";

// Layout
import Layout from "./components/layout/Layout";

// Features
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import Dashboard from "./features/dashboard/Dashboard";
import Leads from "./features/leads/Leads";
import LeadForm from "./features/leads/Form";
import LeadDetail from "./features/leads/Detail";
import Pipeline from "./features/pipeline/Pipeline";
import UserManagement from "./features/users/UserManagement";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";

export default function App() {
  const { login, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refresh_token");
        if (!token) {
          logout();
          setLoading(false);
          return;
        }
        const response = await usersAPI.getMe();
        login(response.data, token, refreshToken);
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [login, logout, setLoading]);

  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <div className="bg-gray-50 min-h-screen flex flex-col justify-center">
              <Login />
            </div>
          } 
        />
        <Route 
          path="/register" 
          element={
            <div className="bg-gray-50 min-h-screen flex flex-col justify-center">
              <Register />
            </div>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
             <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
             </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/leads" 
          element={
             <ProtectedRoute>
                <Layout>
                  <Leads />
                </Layout>
             </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/pipeline" 
          element={
             <ProtectedRoute>
                <Layout>
                  <Pipeline />
                </Layout>
             </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/users" 
          element={
             <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <UserManagement />
                </Layout>
             </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/leads/create" 
          element={
             <ProtectedRoute allowedRoles={["admin", "manager", "agent"]}>
                <Layout>
                  <LeadForm />
                </Layout>
             </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/leads/:id" 
          element={
             <ProtectedRoute>
                <Layout>
                  <LeadDetail />
                </Layout>
             </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/leads/:id/edit" 
          element={
             <ProtectedRoute allowedRoles={["admin", "manager", "agent"]}>
                <Layout>
                  <LeadForm />
                </Layout>
             </ProtectedRoute>
          } 
        />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
