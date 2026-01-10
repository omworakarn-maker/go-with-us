import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';



interface NavbarProps {
  onCreateActivity?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onCreateActivity }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { openCreateModal } = useModal();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Use prop if provided, otherwise use global modal
    if (onCreateActivity) {
      onCreateActivity();
    } else {
      openCreateModal();
    }

    setShowMobileMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[900] px-3 md:px-6 py-3 md:py-4">
        {/* Glass Background Layer - Separated to prevent fixed children trapping */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm"></div>

        {/* Content Layer */}
        <nav className="relative w-full max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-black rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tighter">GoWithUs.</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-8">
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className={`text-xs font-bold transition-colors uppercase tracking-widest ${location.pathname === '/' ? 'text-black' : 'text-gray-400 hover:text-black'}`}>หน้าหลัก</Link>
              <Link to="/explore" className={`text-xs font-bold transition-colors uppercase tracking-widest ${location.pathname === '/explore' ? 'text-black' : 'text-gray-400 hover:text-black'}`}>ที่ปรึกษา</Link>
              <Link to="/activities" className={`text-xs font-bold transition-colors uppercase tracking-widest ${location.pathname === '/activities' ? 'text-black' : 'text-gray-400 hover:text-black'}`}>กิจกรรม</Link>
              <Link to="/mytrips" className={`text-xs font-bold transition-colors uppercase tracking-widest ${location.pathname === '/mytrips' ? 'text-black' : 'text-gray-400 hover:text-black'}`}>ทริปของฉัน</Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateClick}
                className="hidden md:flex px-6 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-all active:scale-95 items-center justify-center"
                type="button"
              >
                สร้างกิจกรรม
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Search Button */}
                  <button
                    onClick={() => navigate('/search')}
                    className="w-9 h-9 bg-white border border-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all shadow-sm active:scale-95"
                    title="ค้นหา"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>

                  {/* Direct Message Button */}
                  <Link
                    to="/chat"
                    className="w-9 h-9 bg-white border border-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all shadow-sm active:scale-95 group relative overflow-hidden"
                    title="Direct Message"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="w-9 h-9 bg-black rounded-full overflow-hidden border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-sm"
                    >
                      {user?.name?.charAt(0).toUpperCase()}
                    </button>

                    <AnimatePresence>
                      {showProfileMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowProfileMenu(false)}
                          ></div>
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-50 origin-top-right"
                          >
                            <div className="px-4 py-3 border-b border-gray-100">
                              <p className="font-bold text-sm text-black">{user?.name}</p>
                              <p className="text-xs text-gray-400">{user?.email}</p>
                            </div>
                            <Link
                              to="/profile"
                              onClick={() => setShowProfileMenu(false)}
                              className="block px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              โปรไฟล์
                            </Link>
                            <Link
                              to="/mytrips"
                              onClick={() => setShowProfileMenu(false)}
                              className="block px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              ทริปของฉัน
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                            >
                              ออกจากระบบ
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-black transition-colors"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-all active:scale-95"
                  >
                    สมัครสมาชิก
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div >
        </nav >
      </div >

      {/* Mobile Menu Popup */}
      {
        showMobileMenu && (
          <>
            <div
              className="fixed inset-0 bg-white z-[950] md:hidden"
              onClick={() => setShowMobileMenu(false)}
            ></div>
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-white z-[1000] md:hidden animate-in slide-in-from-left duration-300 shadow-2xl border-r border-gray-200">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-xl">Menu</span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 space-y-2">
                <Link
                  to="/"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-bold transition-colors ${location.pathname === '/' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  หน้าหลัก
                </Link>
                <Link
                  to="/explore"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-bold transition-colors ${location.pathname === '/explore' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  ที่ปรึกษา
                </Link>
                <Link
                  to="/activities"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-bold transition-colors ${location.pathname === '/activities' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  กิจกรรม
                </Link>
                <Link
                  to="/mytrips"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-bold transition-colors ${location.pathname === '/mytrips' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  ทริปของฉัน
                </Link>
                <button
                  onClick={handleCreateClick}
                  className="w-full px-4 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all mt-4"
                >
                  สร้างกิจกรรม
                </button>
              </div>
            </div>
          </>
        )
      }

    </>
  );
};

export default Navbar;
