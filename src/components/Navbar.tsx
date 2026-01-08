import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


interface NavbarProps {
  onCreateActivity?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onCreateActivity }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    onCreateActivity?.();
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
      <nav className="w-full max-w-6xl flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
          <span className="font-bold text-xl tracking-tighter">GoWithUs.</span>
        </Link>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-xs font-bold transition-colors uppercase tracking-widest ${location.pathname === '/' ? 'text-black' : 'text-gray-400 hover:text-black'}`}>หน้าหลัก</Link>
            <Link to="/explore" className={`text-xs font-bold transition-colors uppercase tracking-widest ${location.pathname === '/explore' ? 'text-black' : 'text-gray-400 hover:text-black'}`}>สำรวจ</Link>
            <Link to="/activities" className={`text-xs font-bold transition-colors uppercase tracking-widest ${location.pathname === '/activities' ? 'text-black' : 'text-gray-400 hover:text-black'}`}>กิจกรรม</Link>
            <Link to="/mytrips" className={`text-xs font-bold transition-colors uppercase tracking-widest ${location.pathname === '/mytrips' ? 'text-black' : 'text-gray-400 hover:text-black'}`}>ทริปของฉัน</Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleCreateClick}
              className="px-6 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-all active:scale-95"
              type="button"
            >
              สร้างกิจกรรม
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
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
                    className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full overflow-hidden border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-sm"
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </button>

                  {showProfileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowProfileMenu(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-bold text-black">{user?.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                          {user?.role === 'admin' && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider">
                              Admin
                            </span>
                          )}
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          โปรไฟล์ของฉัน
                        </Link>
                        <Link
                          to="/mytrips"
                          onClick={() => setShowProfileMenu(false)}
                          className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          กิจกรรมของฉัน
                        </Link>
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            ออกจากระบบ
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 border-2 border-black text-black text-xs font-bold rounded-full hover:bg-black hover:text-white transition-all"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
