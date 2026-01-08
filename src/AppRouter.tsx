import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Activities from './pages/Activities';
import MyTrips from './pages/MyTrips';
import Explore from './pages/Explore';
import CreateActivity from './pages/CreateActivity';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import { TripDetails } from './components/TripDetails';
import ProtectedRoute from './components/ProtectedRoute';

const AppRouter: React.FC = () => {
  // สามารถย้าย state หลักจาก App.tsx มาที่นี่ในอนาคต
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/mytrips" element={<MyTrips />} />
        <Route path="/create" element={<CreateActivity />} />
        <Route path="/trip/:id" element={<TripDetails />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
