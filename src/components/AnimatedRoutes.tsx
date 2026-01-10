import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Pages
import Home from '../pages/Home';
import Activities from '../pages/Activities';
import MyTrips from '../pages/MyTrips';
import Explore from '../pages/Explore';
import CreateActivity from '../pages/CreateActivity';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import Chat from '../pages/Chat';
import SearchPage from '../pages/Search';
import { TripDetails } from './TripDetails';
import { CreateTripModal } from './CreateTripModal';
import ProtectedRoute from './ProtectedRoute';
import Navbar from './Navbar';

// Page Order for Direction Calculation
const PAGE_ORDER: { [key: string]: number } = {
    '/': 0,
    '/explore': 1,
    '/activities': 2,
    '/mytrips': 3,
    '/profile': 4,
};

const AnimatedRoutes: React.FC = () => {
    const location = useLocation();
    const prevPath = React.useRef(location.pathname);
    const direction = React.useRef(0);

    if (location.pathname !== prevPath.current) {
        if (PAGE_ORDER[location.pathname] !== undefined && PAGE_ORDER[prevPath.current] !== undefined) {
            direction.current = PAGE_ORDER[location.pathname] - PAGE_ORDER[prevPath.current];
        } else {
            direction.current = 0; // Default for other pages (fade/zoom only)
        }
        prevPath.current = location.pathname;
    }

    // Animation Variants
    const pageVariants = {
        initial: (direction: number) => ({
            x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
            opacity: 0,
        }),
        animate: {
            x: 0,
            opacity: 1,
            transition: {
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
            },
        },
        exit: (direction: number) => ({
            x: direction > 0 ? '-100%' : direction < 0 ? '100%' : 0,
            opacity: 0,
            transition: {
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
            },
        }),
    };

    // Determine if we should show the global Navbar
    const showNavbar = ['/', '/explore', '/activities', '/mytrips', '/profile', '/chat'].includes(location.pathname) || location.pathname.startsWith('/trip/');

    return (
        <>
            <CreateTripModal />
            {showNavbar && <Navbar />} {/* Fixed Navbar outside AnimatePresence */}

            <AnimatePresence mode="wait" custom={direction.current}>
                <Routes location={location} key={location.pathname}>
                    <Route
                        path="/"
                        element={
                            <motion.div
                                custom={direction.current}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full h-full min-h-screen"
                            >
                                <Home />
                            </motion.div>
                        }
                    />
                    <Route
                        path="/login"
                        element={
                            <Login />
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <Register />
                        }
                    />
                    <Route
                        path="/explore"
                        element={
                            <motion.div
                                custom={direction.current}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full h-full min-h-screen"
                            >
                                <Explore />
                            </motion.div>
                        }
                    />
                    <Route
                        path="/activities"
                        element={
                            <motion.div
                                custom={direction.current}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full h-full min-h-screen"
                            >
                                <Activities />
                            </motion.div>
                        }
                    />
                    <Route
                        path="/mytrips"
                        element={
                            <motion.div
                                custom={direction.current}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full h-full min-h-screen"
                            >
                                <MyTrips />
                            </motion.div>
                        }
                    />
                    <Route path="/create" element={<CreateActivity />} />
                    <Route path="/trip/:id" element={<TripDetails />} />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <motion.div
                                    custom={direction.current}
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="w-full h-full min-h-screen"
                                >
                                    <Profile />
                                </motion.div>
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
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AnimatePresence>
        </>
    );
};

export default AnimatedRoutes;
