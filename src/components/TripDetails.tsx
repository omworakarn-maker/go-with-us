import Navbar from './Navbar';

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trip, AIRecommendation } from '../types';
import { analyzeTripPlan } from '../services/geminiService';
import { tripsAPI, JoinTripData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { GroupChat } from './GroupChat';

// Helper function to convert budget type to Thai text
const getBudgetText = (budget: string): string => {
  switch (budget) {
    case 'Budget':
      return 'ประหยัด';
    case 'Medium':
    case 'Moderate':
      return 'ปานกลาง';
    case 'Luxury':
      return 'หรูหรา';
    default:
      return budget;
  }
};

export const TripDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingTrip, setFetchingTrip] = useState(true);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [showChat, setShowChat] = useState(false);


  // Fetch trip data on mount
  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) {
        setError('ไม่พบรหัสกิจกรรม');
        setFetchingTrip(false);
        return;
      }

      try {
        setFetchingTrip(true);
        const response = await tripsAPI.getById(id);
        setTrip(response.trip);
        setError('');
      } catch (err: any) {
        console.error('Failed to fetch trip:', err);
        setError('ไม่พบกิจกรรมนี้');
      } finally {
        setFetchingTrip(false);
      }
    };

    fetchTrip();
  }, [id]);

  // Check permissions and participation status
  const isCreator = trip?.creatorId === user?.id;
  const isAdmin = user?.role === 'admin';
  const canDelete = isCreator || isAdmin;
  const isParticipant = trip?.participants.some(p => p.userId === user?.id) || false;
  const isFull = (trip?.participants.length || 0) >= (trip?.maxParticipants || 10);

  if (fetchingTrip) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto py-8 px-4 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !trip) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <button onClick={() => navigate(-1)} className="mb-8 text-sm font-medium text-gray-400 hover:text-black transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            กลับ
          </button>
          <div className="text-xl font-bold text-red-500">{error || 'ไม่พบกิจกรรมนี้'}</div>
        </div>
      </>
    );
  }

  const handleAIAnalysis = async () => {
    setLoading(true);
    try {
      const res = await analyzeTripPlan(trip);
      setRecommendation(res);
    } catch (error) {
      alert("AI เกิดข้อผิดพลาดในการวิเคราะห์ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const message = isAdmin && !isCreator
      ? '⚠️ คุณกำลังใช้สิทธิ์ Admin ลบกิจกรรมนี้\n\nการกระทำนี้ไม่สามารถย้อนกลับได้\nต้องการดำเนินการต่อหรือไม่?'
      : 'คุณต้องการลบกิจกรรมนี้ใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้';

    if (window.confirm(message)) {
      try {
        await tripsAPI.delete(trip!.id);
        navigate('/');
      } catch (error: any) {
        console.error('Failed to delete trip:', error);
        alert('ไม่สามารถลบกิจกรรมได้: ' + (error.message || 'เกิดข้อผิดพลาด'));
      }
    }
  };

  const handleJoinTrip = async () => {
    if (!user || !trip) {
      alert('กรุณาเข้าสู่ระบบก่อนเข้าร่วมกิจกรรม');
      navigate('/login');
      return;
    }

    try {
      setJoining(true);
      await tripsAPI.join(trip.id, {
        name: user.name,
        interests: [],
      });

      // Refresh trip data
      const response = await tripsAPI.getById(trip.id);
      setTrip(response.trip);
    } catch (error: any) {
      console.error('Failed to join trip:', error);
      alert(error.message || 'ไม่สามารถเข้าร่วมกิจกรรมได้');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveTrip = async () => {
    if (!trip) return;

    if (window.confirm('คุณต้องการออกจากกิจกรรมนี้ใช่หรือไม่?')) {
      try {
        setJoining(true);
        await tripsAPI.leave(trip.id);

        // Refresh trip data
        const response = await tripsAPI.getById(trip.id);
        setTrip(response.trip);
      } catch (error: any) {
        console.error('Failed to leave trip:', error);
        alert(error.message || 'ไม่สามารถออกจากกิจกรรมได้');
      } finally {
        setJoining(false);
      }
    }
  };

  return (
    <>
      <Navbar />

      {/* Admin Badge - Adjusted position */}
      {isAdmin && (
        <div className="fixed top-24 left-6 z-40 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg animate-in fade-in duration-300 flex items-center gap-2">
          <span>👑</span>
          <span>Admin</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto py-8 px-4 pt-24 animate-in fade-in duration-500 h-fit">

        {/* Navigation & Actions Bar */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-medium text-gray-400 hover:text-black hover:shadow-md transition-all flex items-center gap-2 border border-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            กลับหน้า Home
          </button>

          {canDelete && (
            <button
              onClick={handleDelete}
              className="bg-red-50 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-red-500 hover:bg-red-100 hover:shadow-md transition-all flex items-center gap-2 border border-red-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isAdmin && !isCreator ? 'Admin: ลบกิจกรรม' : 'ลบกิจกรรม'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 animate-in slide-in-from-bottom-4 duration-700">{trip.title}</h1>
            <p className="text-lg text-gray-500 mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">{trip.destination}</p>
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold mb-4">รายละเอียดทริปนี้</h2>
              <p className="text-gray-700 leading-relaxed">{trip.description}</p>
            </div>
            {!recommendation && !loading && (
              <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">สร้างแผนการเดินทางด้วย AI</h3>
                <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">ระบบ AI จะวิเคราะห์ความสนใจของสมาชิกในกลุ่มและสร้างแผนการเดินทางสุดพิเศษให้คุณ</p>
                <button
                  onClick={handleAIAnalysis}
                  className="px-8 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                >
                  วิเคราะห์ด้วย Gemini AI
                </button>
              </div>
            )}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-400 italic">กำลังออกแบบทริปที่ใช่สำหรับคุณ...</p>
              </div>
            )}
            {recommendation && (
              <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
                <section>
                  <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold mb-4">มุมมองจาก AI</h2>
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl text-indigo-900 leading-relaxed italic">
                    "{recommendation.summary}"
                  </div>
                </section>
                <section>
                  <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold mb-6">แผนการเดินทาง</h2>
                  <div className="space-y-8">
                    {recommendation.itinerary.map((day) => (
                      <div key={day.day} className="relative pl-8 border-l border-gray-100">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 bg-black rounded-full border-4 border-white"></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-6">วันที่ {day.day}</h3>
                        <div className="space-y-6">
                          {day.activities.map((act, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                              <span className="text-[10px] font-bold text-indigo-500 uppercase">{act.time}</span>
                              <h4 className="text-md font-medium text-gray-900 mt-1">{act.name}</h4>
                              <p className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {act.location}
                              </p>
                              <p className="text-sm text-gray-600 leading-relaxed">{act.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-right-4 duration-700 delay-300">
              <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold mb-4">ข้อมูลทริป</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">งบประมาณ</span>
                  <span className="font-medium">{getBudgetText(trip.budget)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">เริ่มต้น</span>
                  <span className="font-medium">{trip.startDate}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">สิ้นสุด</span>
                  <span className="font-medium">{trip.endDate}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">สมาชิก</span>
                  <span className="font-medium">{trip.participants.length} / {trip.maxParticipants}</span>
                </div>
              </div>
              {isParticipant ? (
                <button
                  onClick={handleLeaveTrip}
                  disabled={joining}
                  className="w-full mt-6 py-3 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? 'กำลังดำเนินการ...' : 'ออกจากกลุ่ม'}
                </button>
              ) : (
                <button
                  onClick={handleJoinTrip}
                  disabled={joining || isFull || !user}
                  className="w-full mt-6 py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? 'กำลังเข้าร่วม...' : isFull ? 'กลุ่มเต็มแล้ว' : !user ? 'เข้าสู่ระบบเพื่อเข้าร่วม' : 'เข้าร่วมกลุ่มนี้'}
                </button>
              )}
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-right-4 duration-700 delay-500">
              <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold mb-4">สมาชิกในกลุ่ม</h2>
              <div className="space-y-4">
                {trip.participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.interests.join(', ')}</p>
                      </div>
                    </div>
                    {user && p.userId !== user.id && (
                      <button
                        onClick={() => navigate(`/chat?userId=${p.userId}&userName=${encodeURIComponent(p.name)}`)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors bg-gray-50 p-2 rounded-full hover:bg-indigo-50"
                        title="ส่งข้อความส่วนตัว"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>



            {/* Group Chat Button - Only for participants */}
            {isParticipant && (
              <div className="bg-black p-6 rounded-3xl shadow-lg text-white animate-in slide-in-from-right-4 duration-700 delay-700">
                <h2 className="text-sm uppercase tracking-widest font-bold mb-2">แชทกลุ่ม</h2>
                <p className="text-sm text-gray-300 mb-4">คุยกับสมาชิกในกลุ่ม</p>
                <button
                  onClick={() => setShowChat(true)}
                  className="w-full py-3 bg-gray-800 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  เปิดแชท
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Group Chat Modal */}
        {showChat && trip && (
          <GroupChat
            tripId={trip.id}
            tripTitle={trip.title}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </>
  );
};
