import React from 'react';
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
import { ModalProvider } from './contexts/ModalContext';
import AnimatedRoutes from './components/AnimatedRoutes';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <ModalProvider>
        <AnimatedRoutes />
      </ModalProvider>
    </Router>
  );
};

export default AppRouter;
