import React, { useState, useEffect } from 'react';
import { Trip } from '../types';
import { TripCard } from '../components/TripCard';
import { TripDetails } from '../components/TripDetails';
import { tripsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../contexts/ModalContext'; // Import Modal Context
import Loader from '../components/Loader';

const MyTrips: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCreateModal } = useModal(); // Use global modal
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyTrips();
  }, [user, navigate]);

  const fetchMyTrips = async () => {
    try {
      setLoading(true);
      const response = await tripsAPI.getAll();
      const myCreatedTrips = (response.trips || []).filter((trip: Trip) => trip.creatorId === user?.id);
      setTrips(myCreatedTrips);
    } catch (err) {
      console.error('Failed to fetch my trips:', err);
      setError('ไม่สามารถโหลดข้อมูลทริปของคุณได้');
    } finally {
      setLoading(false);
    }
  };

  if (selectedTrip) {
    return <TripDetails trip={selectedTrip} onBack={() => setSelectedTrip(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#121212]">


      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-32 pb-24">
        <header className="mb-12">
          <div className="inline-block px-3 py-1 bg-black text-white text-[10px] font-bold rounded uppercase tracking-widest mb-4">Creator Mode</div>
          <h1 className="text-5xl font-black tracking-tight text-black mb-4">ทริปของฉัน.</h1>
          <p className="text-gray-400 text-lg font-medium max-w-xl">
            จัดการทริปและกิจกรรมที่คุณสร้างขึ้น ติดตามผู้เข้าร่วม และอัปเดตรายละเอียดต่างๆ ได้ที่นี่
          </p>
        </header>

        {loading ? (
          <Loader variant="dots" />
        ) : error ? (
          <div className="py-20 text-center border border-dashed border-red-200 rounded-3xl bg-red-50">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={fetchMyTrips}
              className="text-xs font-bold text-black hover:underline"
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/50">
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/10">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-3">คุณยังไม่มีทริปที่สร้าง</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              เริ่มสร้างทริปแรกของคุณและชวนเพื่อนใหม่ๆ มาร่วมเดินทางไปด้วยกัน
            </p>
            <button
              onClick={openCreateModal} // Use global modal
              className="px-8 py-3 bg-black text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-black/20"
            >
              สร้างทริปเลย
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTrips;
