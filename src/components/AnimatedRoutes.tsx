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
    const [direction, setDirection] = React.useState(0);
    const [prevPath, setPrevPath] = React.useState(location.pathname);

    React.useEffect(() => {
        // Only calculate direction for main nav pages
        if (PAGE_ORDER[location.pathname] !== undefined && PAGE_ORDER[prevPath] !== undefined) {
            setDirection(PAGE_ORDER[location.pathname] - PAGE_ORDER[prevPath]);
        } else {
            setDirection(0); // Default for other pages (fade/zoom only)
        }
        setPrevPath(location.pathname);
    }, [location.pathname, prevPath]);

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

            <AnimatePresence mode="wait" custom={direction}>
                <Routes location={location} key={location.pathname}>
                    <Route
                        path="/"
                        element={
                            <motion.div
                                custom={direction}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full h-full"
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
                                custom={direction}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full h-full"
                            >
                                <Explore />
                            </motion.div>
                        }
                    />
                    <Route
                        path="/activities"
                        element={
                            <motion.div
                                custom={direction}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full h-full"
                            >
                                <Activities />
                            </motion.div>
                        }
                    />
                    <Route
                        path="/mytrips"
                        element={
                            <motion.div
                                custom={direction}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full h-full"
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
                                    custom={direction}
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="w-full h-full"
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
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AnimatePresence>
        </>
    );
};

export default AnimatedRoutes;
