import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { tripsAPI, userAPI } from '../services/api';
import { Trip, Participant } from '../types';
import defaultTripImage from '../assets/Sosuke.jpg';

const SearchPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'users' | 'trips'>('trips');
    const [searchQuery, setSearchQuery] = useState('');
    const [trips, setTrips] = useState<Trip[]>([]);
    const [users, setUsers] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial Data Fetch & Search Effect
    useEffect(() => {
        const fetchTrips = async () => {
            setLoading(true);
            try {
                const response = await tripsAPI.getAll({});
                setTrips(response.trips || []);
            } catch (error) {
                console.error("Failed to fetch trips", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrips();
    }, []);

    // Search Users Effect (Debounced)
    useEffect(() => {
        if (activeTab === 'users') {
            const timer = setTimeout(async () => {
                setLoading(true);
                try {
                    const foundUsers = await userAPI.getAll(searchQuery);
                    setUsers(foundUsers || []);
                } catch (error) {
                    console.error("Failed to search users", error);
                    setUsers([]); // Clear users on error
                } finally {
                    setLoading(false);
                }
            }, 500); // 500ms debounce

            return () => clearTimeout(timer);
        }
    }, [searchQuery, activeTab]);

    // Filter Logic for Trips (Client-side)
    const filteredTrips = trips.filter(t =>
        (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.province || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Users are now filtered server-side, so just use 'users' state
    const filteredUsers = users;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <div className="flex-1 pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full">

                {/* Search Header */}
                <div className="max-w-3xl mx-auto mb-12 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5x1 font-black tracking-tight">ค้นหา</h1>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={activeTab === 'users' ? "ค้นหาเพื่อนใหม่..." : "ค้นหากิจกรรม..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl text-lg placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
                            autoFocus
                        />
                        <svg className="absolute left-4 top-5 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Tab Selection */}
                    <div className="flex justify-center gap-2 p-1 bg-gray-100 rounded-full w-fit mx-auto">
                        <button
                            onClick={() => { setActiveTab('trips'); setSearchQuery(''); }}
                            className={`px-8 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'trips' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'
                                }`}
                        >
                            หากิจกรรม
                        </button>
                        <button
                            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                            className={`px-8 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'
                                }`}
                        >
                            หาเพื่อน
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="max-w-5xl mx-auto">
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-400 font-bold">กำลังค้นหาข้อมูล...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            {activeTab === 'trips' ? (
                                // Trips Grid
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredTrips.map(trip => (
                                        <div key={trip.id} className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                                            <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                                <img
                                                    src={trip.imageUrl || defaultTripImage}
                                                    alt={trip.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                                    {trip.category}
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-lg leading-tight line-clamp-2">{trip.title}</h3>
                                                </div>
                                                <div className="flex items-center text-gray-500 text-xs font-bold mb-4 gap-2">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        {trip.destination}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        {new Date(trip.startDate).toLocaleDateString('th-TH')}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/trip/${trip.id}`)}
                                                    className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
                                                >
                                                    ดูรายละเอียด
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredTrips.length === 0 && (
                                        <div className="col-span-full text-center py-20 opacity-50">
                                            <p className="text-xl font-bold">ไม่พบกิจกรรมที่ค้นหา</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Users List
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {filteredUsers.map(user => (
                                        <div key={user.id} className="bg-white border-2 border-gray-100 p-5 rounded-3xl flex items-center gap-4 hover:border-black transition-colors group cursor-pointer"
                                            onClick={() => navigate(`/chat?userId=${user.id}&userName=${user.name}`)}
                                        >
                                            <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center font-black text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                                                {(user.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-lg truncate">{user.name || 'Unknown User'}</h3>
                                                <p className="text-xs text-gray-500 font-medium">สมาชิก Active</p>
                                            </div>
                                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8H8l-4 4V5a2 2 0 012-2h12a2 2 0 012 2z" /></svg>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <div className="col-span-full text-center py-20 opacity-50">
                                            <p className="text-xl font-bold">ไม่พบผู้ใช้งาน</p>
                                            <p className="text-sm">ลองค้นหาจากคนที่เข้าร่วมกิจกรรมต่างๆ</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
