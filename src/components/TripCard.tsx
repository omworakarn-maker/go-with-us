
import React from 'react';
import { Link } from 'react-router-dom';
import { Trip } from '../types';
import { TRIP_CATEGORIES } from '../constants/categories';
import defaultTripImage from '../assets/Sosuke.jpg';

interface TripCardProps {
  trip: Trip;
  onClick?: (trip: Trip) => void;
}

// Helper function to format date in Thai
const formatDateThai = (dateString: string): string => {
  const date = new Date(dateString);
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  const dayName = thaiDays[date.getDay()];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];

  return `${dayName}, ${day} ${month}`;
};

export const TripCard: React.FC<TripCardProps> = ({ trip, onClick }) => {
  const participantCount = trip.participants?.length || 0;
  const displayParticipants = participantCount > 0 ? trip.participants.slice(0, 3) : [];

  // Find category with emoji
  const categoryData = TRIP_CATEGORIES.find(c => c.label === trip.category);

  // Status Logic
  const now = new Date();

  // Start Date (00:00:00)
  const start = new Date(trip.startDate);
  start.setHours(0, 0, 0, 0);

  // End Date Logic
  const end = trip.endDate ? new Date(trip.endDate) : new Date(trip.startDate);
  end.setHours(23, 59, 59, 999);

  const isEnded = now > end;

  // Calculate Diff in days (integer)
  const oneDay = 1000 * 60 * 60 * 24;
  const diffTime = start.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / oneDay);

  // Check if it's "Today" (ongoing)
  const isToday = now >= start && now <= end;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(trip);
    }
  };

  return (
    <Link
      to={`/trip/${trip.id}`}
      onClick={handleClick}
      className="group bg-white border border-gray-200 rounded-3xl p-4 md:p-6 transition-all duration-500 cursor-pointer flex flex-col md:flex-row gap-4 md:gap-8 items-stretch hover:border-black hover:shadow-xl shadow-sm relative overflow-hidden h-full"
    >
      <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden bg-gray-50 shrink-0 relative">
        <img
          src={trip.imageUrl || defaultTripImage}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${isEnded ? 'grayscale opacity-70' : ''}`}
          alt={trip.title}
        />

        {/* Category Badge - On Image (Top Right) */}
        {trip.category && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm border border-white/50 flex items-center gap-1 z-10 text-black">
            <span>{categoryData?.emoji || '✨'}</span>
            <span>{trip.category}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col pt-4 md:pt-0">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isEnded ? 'text-gray-400' : 'text-indigo-500'}`}>
            {formatDateThai(trip.startDate)}
          </span>

          {/* Status Text Right Aligned */}
          {!isEnded ? (
            isToday ? (
              <span className="text-[10px] font-bold text-indigo-600">วันนี้!</span>
            ) : daysLeft > 0 && daysLeft <= 30 ? (
              <span className="text-[10px] font-bold text-gray-400">เหลืออีก {daysLeft} วัน</span>
            ) : null
          ) : (
            <span className="text-[10px] font-bold text-gray-300">สิ้นสุดแล้ว</span>
          )}
        </div>

        <h3 className={`text-2xl font-black leading-tight tracking-tighter mb-2 ${isEnded ? 'text-gray-400 line-through decoration-2' : 'text-black'}`}>
          {trip.title}
        </h3>

        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-4">
          {trip.destination}
        </p>

        <p className="text-gray-500 leading-relaxed font-medium line-clamp-2 max-w-xl text-sm mb-4">
          {trip.description}
        </p>



        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50 w-full">
          <div className="flex items-center gap-2 md:gap-3">
            {participantCount > 0 ? (
              <>
                <div className="flex -space-x-3">
                  {displayParticipants.map((participant, index) => (
                    <div key={participant.id} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.id}`}
                        alt={participant.name}
                      />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] md:text-[11px] font-bold text-black whitespace-nowrap">
                  {participantCount} คนเข้าร่วม
                </span>
              </>
            ) : (
              <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                ยังไม่มีคนเข้าร่วม
              </span>
            )}
          </div>

          <span className="flex items-center gap-1 md:gap-2 text-[10px] md:text-[11px] font-bold text-black uppercase tracking-widest group-hover:translate-x-2 transition-all whitespace-nowrap ml-4">
            ดูรายละเอียด <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
};
