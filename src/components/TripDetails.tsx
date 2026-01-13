

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Trip, AIRecommendation, DayPlan } from '../types';
import { analyzeTripPlan } from '../services/geminiService';
import { tripsAPI, JoinTripData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { GroupChat } from './GroupChat';
import { TRIP_CATEGORIES } from '../constants/categories';
import { GalleryManager } from './GalleryManager';
import { ItineraryEditor } from './ItineraryEditor';
import Loader from './Loader';
import { motion, AnimatePresence } from 'framer-motion';

const formatBudget = (budget: number | string): string => {
  const num = Number(budget);
  if (num === 0) return 'FREE';
  return num.toLocaleString('th-TH') + ' บาท';
};

// Helper function to format date (remove time part)
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  return dateString.split('T')[0]; // Return only YYYY-MM-DD
};

// Helper function to format date for display
const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return '-';
  return dateString.split('T')[0]; // Return YYYY-MM-DD format
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // For deleting TRIP
  const [showKickModal, setShowKickModal] = useState(false);   // For kicking USER
  const [userToKick, setUserToKick] = useState<{ id: string; name: string } | null>(null);

  const [aiPrompt, setAiPrompt] = useState(''); // New state for custom AI prompt
  const [updating, setUpdating] = useState(false);
  // Delete state - moved to top level to avoid hook order errors
  const [deleting, setDeleting] = useState(false);

  // Gallery and Itinerary state
  const [gallery, setGallery] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [savingContent, setSavingContent] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Image Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Derived state for images
  const allImages = trip ? [trip.imageUrl, ...(trip.gallery || [])].filter(Boolean) as string[] : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    destination: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: 1000,
    maxParticipants: 10,
    category: '',
  });

  const [showAIConfirmModal, setShowAIConfirmModal] = useState(false);

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

        // Initialize edit form with trip data
        setEditForm({
          title: response.trip.title,
          destination: response.trip.destination,
          description: response.trip.description || '',
          startDate: formatDate(response.trip.startDate),
          endDate: formatDate(response.trip.endDate),
          budget: response.trip.budget,
          maxParticipants: response.trip.maxParticipants,
          category: response.trip.category,
        });
        setGallery(response.trip.gallery || []);
        setItinerary(response.trip.itinerary || []);

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
  const canEdit = isCreator || isAdmin; // Only creator or admin can edit
  const isParticipant = trip?.participants.some(p => p.userId === user?.id) || false;
  const isFull = (trip?.participants.length || 0) >= (trip?.maxParticipants || 10);

  const handleEditTrip = () => {
    setShowEditModal(true);
  };

  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    try {
      setUpdating(true);

      // Prepare update data (endDate is optional)
      const updateData: any = {
        title: editForm.title,
        destination: editForm.destination,
        description: editForm.description,
        startDate: editForm.startDate,
        budget: editForm.budget,
        maxParticipants: editForm.maxParticipants,
        category: editForm.category,
      };

      // Only include endDate if it's provided
      if (editForm.endDate) {
        updateData.endDate = editForm.endDate;
      }

      await tripsAPI.update(trip.id, updateData);

      // Refresh trip data
      const response = await tripsAPI.getById(trip.id);
      setShowEditModal(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Failed to update trip:', error);
      alert(error.message || 'ไม่สามารถอัปเดตทริปได้');
    } finally {
      setUpdating(false);
    }
  };

  if (fetchingTrip) {
    return (
      <>

        <div className="max-w-4xl mx-auto py-8 px-4 flex items-center justify-center min-h-[60vh]">
          <Loader variant="dots" />
        </div>
      </>
    );
  }

  if (error || !trip) {
    return (
      <>

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

  const handleSaveContent = async () => {
    if (!trip) return;

    try {
      setSavingContent(true);
      await tripsAPI.update(trip.id, {
        gallery,
        itinerary,
        // Save AI analysis if available (from new recommendation) or keep existing (implicit in backend if not sent?)
        // actually only send if we have a NEW recommendation we want to commit, OR just always send the current state if we had editable fields.
        // For now, if recommendation exists, we save it.
        ...(recommendation ? {
          summary: recommendation.summary,
          groupAnalysis: recommendation.groupAnalysis
        } : {})
      });

      // Refresh trip data
      const response = await tripsAPI.getById(trip.id);
      setTrip(response.trip);

      // อัปเดต state ให้ตรงกับข้อมูลที่บันทึก
      setGallery(response.trip.gallery || []);
      setItinerary(response.trip.itinerary || []);

      setNotification({ message: 'บันทึกรูปภาพและแผนการเดินทางสำเร็จ', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Failed to save content:', error);
      setNotification({ message: 'ไม่สามารถบันทึกได้: ' + (error.message || 'เกิดข้อผิดพลาด'), type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSavingContent(false);
    }
  };



  const handleAIAnalysis = () => {
    if (itinerary.length > 0) {
      setShowAIConfirmModal(true);
      return;
    }
    confirmRunAI();
  };

  const confirmRunAI = async () => {
    setShowAIConfirmModal(false);
    if (!trip) return;

    setLoading(true);
    try {
      const res = await analyzeTripPlan(trip, aiPrompt);
      setRecommendation(res);

      // Auto-populate itinerary editor
      if (res.itinerary && res.itinerary.length > 0) {
        setItinerary(res.itinerary);

        // Notify user and scroll to editor
        setNotification({ message: 'AI ได้ร่างแผนการเดินทางให้คุณแล้ว', type: 'success' });
        setTimeout(() => {
          setNotification(null);
          document.getElementById('content-management')?.scrollIntoView({ behavior: 'smooth' });
        }, 2000);
      }
    } catch (error) {
      setNotification({ message: 'AI เกิดข้อผิดพลาดในการวิเคราะห์ กรุณาลองใหม่อีกครั้ง', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSummary = async () => {
    if (!trip) return;
    if (!confirm('ต้องการลบข้อมูลมุมมองจาก AI หรือไม่?')) return;

    try {
      await tripsAPI.update(trip.id, {
        summary: "",
        groupAnalysis: ""
      });

      // Refresh local state
      const response = await tripsAPI.getById(trip.id);
      setTrip(response.trip);
      setRecommendation(null); // Clear any fresh recommendation

      setNotification({ message: 'ลบข้อมูลมุมมองจาก AI สำเร็จ', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Failed to delete summary:', error);
      alert('ไม่สามารถลบข้อมูลได้');
    }
  };



  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteTrip = async () => {
    try {
      setDeleting(true);
      // Add a slight delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      await tripsAPI.delete(trip!.id);
      navigate('/');
    } catch (error: any) {
      console.error('Failed to delete trip:', error);
      alert('ไม่สามารถลบกิจกรรมได้: ' + (error.message || 'เกิดข้อผิดพลาด'));
      setDeleting(false);
    }
  };

  const handleKickClick = (userId: string, userName: string) => {
    setUserToKick({ id: userId, name: userName });
    setShowKickModal(true);
  };

  const confirmKickUser = async () => {
    if (!trip || !userToKick) return;

    // Close modal immediately
    setShowKickModal(false);

    try {
      await tripsAPI.removeParticipant(trip.id, userToKick.id);

      // Refresh current trip data
      const response = await tripsAPI.getById(trip.id);
      setTrip(response.trip);

      setNotification({ message: `ลบคุณ ${userToKick.name} ออกจากทริปแล้ว`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Failed to kick user:', error);
      alert('ไม่สามารถลบสมาชิกได้: ' + (error.message || 'เกิดข้อผิดพลาด'));
    }
  };



  const handleJoinTrip = () => {
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อนเข้าร่วมกิจกรรม');
      navigate('/login');
      return;
    }
    setShowJoinModal(true);
  };

  const confirmJoinTrip = async () => {
    if (!user || !trip) return;

    try {
      setJoining(true);
      await tripsAPI.join(trip.id, {
        name: user.name,
        interests: [],
      });

      // Refresh trip data
      const response = await tripsAPI.getById(trip.id);
      setTrip(response.trip);
      setShowJoinModal(false);
    } catch (error: any) {
      console.error('Failed to join trip:', error);
      alert(error.message || 'ไม่สามารถเข้าร่วมกิจกรรมได้');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveTrip = () => {
    if (!trip) return;
    setShowLeaveModal(true);
  };

  const confirmLeaveTrip = async () => {
    if (!trip) return;

    try {
      setJoining(true); // Re-using joining state for loading indicator
      await tripsAPI.leave(trip.id);

      // Refresh trip data
      const response = await tripsAPI.getById(trip.id);
      setTrip(response.trip);
      setShowLeaveModal(false);
    } catch (error: any) {
      console.error('Failed to leave trip:', error);
      alert(error.message || 'ไม่สามารถออกจากกิจกรรมได้');
    } finally {
      setJoining(false);
    }
  };

  return (
    <>


      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-24 left-1/2 z-[100] px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md ${notification.type === 'success'
              ? 'bg-white/90 text-black border border-gray-200'
              : 'bg-red-500/90 text-white border border-red-400'
              }`}
          >
            {notification.type === 'success' ? (
              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
            ) : (
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
            )}
            <span className="font-bold text-sm tracking-wide">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Badge - Adjusted position */}
      {isAdmin && (
        <div className="fixed top-24 left-6 z-40 px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg animate-in fade-in duration-300 flex items-center gap-2">
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

          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={handleEditTrip}
                className="bg-indigo-50 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-indigo-600 hover:bg-indigo-100 hover:shadow-md transition-all flex items-center gap-2 border border-indigo-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                แก้ไขทริป
              </button>
            )}
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Trip Image Gallery Slider */}
            {allImages.length > 0 && (
              <>
                <div className="w-full h-96 rounded-3xl overflow-hidden shadow-lg animate-in fade-in duration-700 relative group bg-gray-100 mb-8 cursor-pointer" onClick={() => setShowFullScreenImage(true)}>
                  <img
                    src={allImages[currentImageIndex]}
                    alt={trip.title}
                    className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=No+Image';
                    }}
                  />

                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </button>

                      {/* Dots Indicator */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {allImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                            className={`w-2 h-2 rounded-full transition-all shadow-sm ${currentImageIndex === idx ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                              }`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Image Counter Badge */}
                  {allImages.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  )}

                  {/* Expand Hint */}
                  <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md text-white/80 text-xs font-medium px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    คลิกเพื่อดูภาพเต็ม
                  </div>
                </div>

                {/* Full Screen Image Modal */}
                {createPortal(
                  <AnimatePresence>
                    {showFullScreenImage && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                        onClick={() => setShowFullScreenImage(false)}
                      >
                        {/* Close Button */}
                        <button
                          onClick={() => setShowFullScreenImage(false)}
                          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 p-2 rounded-full z-10"
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {/* Main Image */}
                        <motion.img
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
                          src={allImages[currentImageIndex]}
                          alt={trip.title}
                          onClick={(e) => e.stopPropagation()} // Prevent close on image click
                        />

                        {/* Navigation Overlays */}
                        {allImages.length > 1 && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); prevImage(); }}
                              className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all bg-white/10 hover:bg-white/20 p-4 rounded-full"
                            >
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); nextImage(); }}
                              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all bg-white/10 hover:bg-white/20 p-4 rounded-full"
                            >
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </>
                        )}

                        {/* Footer Info */}
                        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
                          <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium">
                            {currentImageIndex + 1} / {allImages.length}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>,
                  document.body
                )}
              </>
            )}

            {/* Trip Info - Restored */}
            <h1 className="text-4xl font-bold text-gray-900 mb-2 animate-in slide-in-from-bottom-4 duration-700">{trip.title}</h1>
            <p className="text-lg text-gray-500 mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">{trip.destination}</p>
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold mb-4">รายละเอียดทริปนี้</h2>
              <p className="text-gray-700 leading-relaxed">{trip.description}</p>
            </div>

            {/* Additional Images Gallery - Restored & Interactive */}
            {trip.gallery && trip.gallery.length > 0 && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-250">
                <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold mb-4">
                  รูปภาพเพิ่มเติม
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {trip.gallery.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-48 object-cover rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:opacity-90"
                      onClick={() => {
                        // Calculate index in allImages array
                        // allImages = [trip.imageUrl, ...trip.gallery]
                        // So gallery index i corresponds to i + 1 (if imageUrl exists)
                        const offset = trip.imageUrl ? 1 : 0;
                        setCurrentImageIndex(index + offset);
                        setShowFullScreenImage(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-400 italic">กำลังออกแบบทริปที่ใช่สำหรับคุณ...</p>
              </div>
            )}

            {/* Itinerary Creation Section - Only for Creator OR Admin */}
            {(isCreator || isAdmin) && !recommendation && !loading && (
              <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">สร้างแผนการเดินทาง</h3>
                <p className="text-sm text-gray-500 text-center mb-8 max-w-md">
                  เลือกวิธีที่คุณต้องการในการสร้างแผนการเดินทางสำหรับทริปนี้
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                  {/* Manual Option */}
                  <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-gray-400 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-800 group-hover:text-white transition-all">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">สร้างเอง</h4>
                    <p className="text-sm text-gray-600 mb-4">ออกแบบแผนการเดินทางด้วยตัวเอง ควบคุมทุกรายละเอียดได้เต็มที่</p>
                    <button
                      onClick={() => {
                        document.getElementById('content-management')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all"
                    >
                      เริ่มสร้าง
                    </button>
                  </div>

                  {/* AI Option */}
                  <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-gray-400 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-800 group-hover:text-white transition-all">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">ใช้ AI ช่วย</h4>
                    <p className="text-sm text-gray-600 mb-4">ให้ Gemini AI วิเคราะห์และสร้างแผนการเดินทางให้อัตโนมัติ</p>
                    <button
                      onClick={handleAIAnalysis}
                      className="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all"
                    >
                      วิเคราะห์ด้วย AI
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Display Custom Itinerary - For Everyone EXCEPT Creator/Admin (who use the editor) */}
            {trip.itinerary && trip.itinerary.length > 0 && !(isCreator || isAdmin) && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                <section>
                  <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold mb-6">แผนการเดินทาง</h2>
                  <div className="space-y-8">
                    {trip.itinerary.map((day) => (
                      <div key={day.day} className="relative pl-8 border-l border-gray-100">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 bg-black rounded-full border-4 border-white"></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-6">วันที่ {day.day}</h3>
                        <div className="space-y-6">
                          {day.activities.map((act, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                              <span className="text-[10px] font-bold text-gray-500 uppercase">{act.time}</span>
                              <h4 className="text-md font-medium text-gray-900 mt-1">{act.name}</h4>
                              <p className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {act.location}
                              </p>
                              {act.description && (
                                <p className="text-sm text-gray-600 leading-relaxed">{act.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* AI Perspective / Summary - Always show if available (Fresh or Saved) */}
            {(recommendation?.summary || trip?.summary) && (
              <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold">มุมมองจาก AI</h2>
                    <button
                      onClick={handleAIAnalysis}
                      disabled={loading}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 bg-indigo-50 px-3 py-2 rounded-full hover:bg-indigo-100"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      {loading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ใหม่'}
                    </button>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl text-indigo-900 leading-relaxed italic relative group">
                    {/* Delete Button (Only for Creator/Admin) */}
                    {(isCreator || isAdmin) && (
                      <button
                        onClick={handleDeleteSummary}
                        className="absolute top-4 right-4 text-indigo-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                        title="ลบข้อมูลนี้"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                    <div className="absolute top-6 left-6 opacity-20">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.01699L9.01699 21H14.017ZM16.017 21L16.017 18C16.017 16.8954 16.9124 16 18.017 16H21.017L21.017 21H16.017ZM23 14H3V3H23V14ZM11.017 14V11H13.017V14H11.017ZM7.01699 14V11H9.01699V14H7.01699Z" /></svg>
                    </div>
                    <div className="pl-8 relative z-10">
                      <span className="font-bold mr-2">Summary:</span>
                      {recommendation?.summary || trip?.summary}
                    </div>
                    {(recommendation?.groupAnalysis || trip?.groupAnalysis) && (
                      <div className="pl-8 mt-4 pt-4 border-t border-indigo-100/50 relative z-10">
                        <span className="font-bold mr-2">Analysis:</span>
                        {recommendation?.groupAnalysis || trip?.groupAnalysis}
                      </div>
                    )}
                  </div>
                </section>

                {/* Show Itinerary from Recommendation ONLY if fresh (user hasn't saved yet or is previewing) */}
                {recommendation && (
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold">แผนการเดินทาง (ร่างจาก AI)</h2>
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md font-bold">PREVIEW</span>
                    </div>
                    <div className="space-y-8 opacity-75 grayscale-[30%] hover:grayscale-0 transition-all">
                      {recommendation.itinerary?.map((day) => (
                        <div key={day.day} className="relative pl-8 border-l border-gray-100">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 bg-indigo-200 rounded-full border-4 border-white"></div>
                          <h3 className="text-lg font-bold text-gray-900 mb-6">วันที่ {day.day}</h3>
                          <div className="space-y-6">
                            {day.activities?.map((act, i) => (
                              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">{act.time}</span>
                                <h4 className="text-md font-medium text-gray-900 mt-1">{act.name}</h4>
                                <p className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
                                  {act.location}
                                </p>
                                <p className="text-sm text-gray-600 leading-relaxed">{act.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 text-center">
                      <p className="text-sm text-gray-500 mb-4">ชอบแผนนี้ไหม? อย่าลืมกด <b>"บันทึกการเปลี่ยนแปลง"</b> ด้านล่างเพื่อนำไปใช้จริง</p>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Content Management Section - Only for Creator OR Admin */}
            {(isCreator || isAdmin) && (
              <div id="content-management" className="space-y-8 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm scroll-mt-24">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold">
                      จัดการเนื้อหา
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">เพิ่มรูปภาพและสร้างแผนการเดินทางของคุณเอง</p>
                  </div>
                  <button
                    onClick={handleSaveContent}
                    disabled={savingContent}
                    className="px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {savingContent ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังบันทึก...
                      </span>
                    ) : (
                      'บันทึกการเปลี่ยนแปลง'
                    )}
                  </button>
                </div>

                <GalleryManager gallery={gallery} onUpdate={setGallery} />

                <div className="border-t border-gray-200 pt-8">
                  <ItineraryEditor itinerary={itinerary} onUpdate={setItinerary} />
                </div>

                {/* หมายเหตุ */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-sm font-medium text-amber-900 mb-1">อย่าลืมบันทึก!</p>
                  <p className="text-xs text-amber-700">
                    หลังจากเพิ่มรูปภาพหรือสร้างแผนการเดินทางเสร็จแล้ว กรุณากดปุ่ม <strong>"บันทึกการเปลี่ยนแปลง"</strong> ด้านบนเพื่อบันทึกข้อมูล
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-right-4 duration-700 delay-300">
              <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold mb-4">ข้อมูลทริป</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">ผู้สร้างทริป</span>
                  <span className="font-medium">{trip.creator?.name || 'ไม่ระบุ'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">งบประมาณ</span>
                  <span className="font-medium">{formatBudget(trip.budget)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">เริ่มต้น</span>
                  <span className="font-medium">{formatDateDisplay(trip.startDate)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">สิ้นสุด</span>
                  <span className="font-medium">{trip.endDate ? formatDateDisplay(trip.endDate) : 'ยังไม่มีกำหนดการ'}</span>
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
                  <div key={p.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.interests.join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {user && p.userId !== user.id && (
                        <button
                          onClick={() => navigate(`/chat?userId=${p.userId}&userName=${encodeURIComponent(p.name)}`)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors bg-gray-50 p-2 rounded-full hover:bg-indigo-50"
                          title="ส่งข้อความส่วนตัว"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </button>
                      )}

                      {/* Kick User Button (Creator/Admin Only) */}
                      {(isCreator || isAdmin) && p.userId !== trip.creatorId && (
                        <button
                          onClick={() => handleKickClick(p.userId, p.name)}
                          className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 p-2 rounded-full hover:bg-red-50"
                          title="ลบออกจากทริป"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                        </button>
                      )}
                    </div>
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



        {/* Join Confirmation Modal */}
        <AnimatePresence>
          {showJoinModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">ยืนยันเข้าร่วม?</h3>
                <p className="text-gray-500 mb-8">
                  คุณต้องการเข้าร่วมทริป "{trip.title}" ใช่หรือไม่
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-100 font-bold text-gray-600 hover:border-gray-300 hover:text-black transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmJoinTrip}
                    className="flex-1 py-3 px-4 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition-all shadow-lg"
                  >
                    ยืนยัน
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leave Confirmation Modal */}
        <AnimatePresence>
          {showLeaveModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
              >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">ยืนยันออกจากทริป?</h3>
                <p className="text-gray-500 mb-8">
                  คุณต้องการออกจากทริป "{trip.title}" ใช่หรือไม่
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-100 font-bold text-gray-600 hover:border-gray-300 hover:text-black transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmLeaveTrip}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg"
                  >
                    ออกเลย
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kick User Confirmation Modal */}
        <AnimatePresence>
          {showKickModal && userToKick && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการลบสมาชิก</h3>
                <p className="text-gray-500 mb-8 text-sm">
                  คุณต้องการลบคุณ <span className="font-bold text-gray-800">"{userToKick.name}"</span> ออกจากทริปนี้ใช่หรือไม่?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowKickModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmKickUser}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                  >
                    ลบสมาชิก
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
              >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {isAdmin && !isCreator ? 'Admin: ลบกิจกรรมนี้?' : 'ลบกิจกรรมนี้?'}
                </h3>
                <p className="text-gray-500 mb-8">
                  การลบกิจกรรมไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะหายไป
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-100 font-bold text-gray-600 hover:border-gray-300 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmDeleteTrip}
                    disabled={deleting}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังลบ...
                      </>
                    ) : (
                      'ลบทันที'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Re-analysis Confirmation Modal */}
        <AnimatePresence>
          {showAIConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
              >

                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">สร้างแผนใหม่?</h3>
                <p className="text-gray-500 mb-6">
                  แผนเดิมจะถูกเขียนทับ คุณต้องการให้เพิ่มเงื่อนไขอะไรเป็นพิเศษไหม?
                </p>

                {/* Custom Prompt Input */}
                <div className="mb-8 text-left">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">คำขอพิเศษ (ไม่บังคับ)</label>
                  <textarea
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-4 text-sm font-medium outline-none transition-all resize-none placeholder:text-gray-300"
                    placeholder="เช่น ขอเน้นร้านกาแฟ, ไม่เอาวัด, ขอแบบลุยๆ..."
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAIConfirmModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-100 font-bold text-gray-600 hover:border-gray-300 hover:text-black transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmRunAI}
                    className="flex-1 py-3 px-4 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition-all shadow-lg"
                  >
                    วิเคราะห์เลย
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Modal - Beautiful Monochrome Style */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
              >


                <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                </div>

                <h3 className="text-3xl font-black tracking-tight text-black mb-3">สำเร็จ!</h3>
                <p className="text-gray-500 font-medium mb-10">
                  ข้อมูลทริปของคุณถูกอัปเดตเรียบร้อยแล้ว
                </p>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 bg-black text-white text-lg font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                >
                  ตกลง
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Trip Modal - Refined UI */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/95 backdrop-blur-md"
            >
              <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-xl bg-white p-6 md:p-10 rounded-[2rem] shadow-2xl border border-gray-100 overflow-y-auto max-h-[85vh] no-scrollbar relative"
              >

                <button
                  onClick={() => setShowEditModal(false)}
                  className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h2 className="text-3xl font-black tracking-tight text-black mb-1">แก้ไขทริป.</h2>
                <p className="text-gray-400 text-xs font-medium mb-8">ปรับปรุงข้อมูลกิจกรรมของคุณให้สมบูรณ์</p>

                <form onSubmit={handleUpdateTrip} className="space-y-6">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-black transition-colors">ชื่อทริปหรือกิจกรรม</label>
                    <input
                      required
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 text-base font-bold outline-none transition-all placeholder:text-gray-300"
                      placeholder="เช่น เที่ยวคาเฟ่ย่านอารีย์..."
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-black transition-colors">สถานที่</label>
                      <input
                        required
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 text-sm font-bold outline-none transition-all"
                        value={editForm.destination}
                        onChange={e => setEditForm({ ...editForm, destination: e.target.value })}
                      />
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-black transition-colors">หมวดหมู่</label>
                      <div className="relative">
                        <select
                          required
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 text-sm font-bold outline-none appearance-none transition-all cursor-pointer"
                          value={editForm.category}
                          onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                        >
                          {TRIP_CATEGORIES.map(c => (
                            <option key={c.id} value={c.label}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-black transition-colors">วันที่เริ่ม</label>
                      <input required type="date" className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 text-sm font-bold outline-none transition-all" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} />
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-black transition-colors">วันที่สิ้นสุด (ไม่บังคับ)</label>
                      <input type="date" className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 text-sm font-bold outline-none transition-all" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} min={editForm.startDate} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-black transition-colors">งบประมาณ (บาท)</label>
                      <div className="relative">
                        <input
                          required
                          type="number"
                          min="0"
                          step="100"
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 text-sm font-bold outline-none transition-all"
                          placeholder="0"
                          value={editForm.budget}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            setEditForm({ ...editForm, budget: isNaN(val) ? 0 : Math.max(0, val) });
                          }}
                        />
                        {editForm.budget === 0 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <span className="text-black font-black text-[10px] bg-gray-200 px-1.5 py-0.5 rounded">FREE</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-black transition-colors">จำนวนคนสูงสุด</label>
                      <input required type="number" min="1" max="15" className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 text-sm font-bold outline-none transition-all" value={editForm.maxParticipants} onChange={e => setEditForm({ ...editForm, maxParticipants: Math.min(15, Math.max(1, parseInt(e.target.value) || 1)) })} />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-black transition-colors">รายละเอียด</label>
                    <textarea rows={4} className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 text-sm font-medium outline-none transition-all resize-none placeholder:text-gray-300" placeholder="อธิบายลายละเอียดกิจกรรม..." value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={updating}
                      className="w-full py-4 bg-black text-white text-base font-bold rounded-xl hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {updating ? (
                        <span className="flex items-center justify-center gap-3">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          กำลังอัปเดต...
                        </span>
                      ) : (
                        'บันทึกการเปลี่ยนแปลง'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
