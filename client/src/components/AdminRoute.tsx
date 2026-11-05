import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

const AdminRoute: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAdmin(false);
        return;
      }

      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      }
    };
    verifyAdmin();
  }, []);

  if (isAdmin === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-bg)', color: 'var(--color-accent)' }}>Verifying access...</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;
