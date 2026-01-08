
import React from 'react';
import { Link } from 'react-router-dom';
import { Trip } from '../types';

interface TripCardProps {
  trip: Trip;
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

export const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  const participantCount = trip.participants?.length || 0;
  const displayParticipants = participantCount > 0 ? trip.participants.slice(0, 3) : [];

  return (
    <Link
      to={`/trip/${trip.id}`}
      className="group bg-white border border-gray-200 rounded-3xl p-6 transition-all duration-500 cursor-pointer flex flex-col md:flex-row gap-8 items-start hover:border-black hover:shadow-xl shadow-sm"
    >
      <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden bg-gray-50 shrink-0">
        <img
          src={trip.imageUrl || `https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&q=80`}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          alt={trip.title}
        />
      </div>

      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
            {formatDateThai(trip.startDate)}
          </span>
        </div>

        <h3 className="text-3xl font-black text-black leading-tight tracking-tighter">
          {trip.title}
        </h3>

        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
          {trip.destination}
        </p>

        <p className="text-gray-500 leading-relaxed font-medium line-clamp-2 max-w-xl text-sm">
          {trip.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center gap-4">
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
                <span className="text-[11px] font-bold text-black">
                  {participantCount} คนเข้าร่วม
                </span>
              </>
            ) : (
              <span className="text-[11px] font-medium text-gray-400">
                ยังไม่มีคนเข้าร่วม
              </span>
            )}
          </div>

          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group-hover:gap-4 transition-all">
            ดูรายละเอียด <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
};
