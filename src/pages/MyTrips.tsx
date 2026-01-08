import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MyTrips: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#121212]">
      <Navbar onCreateActivity={() => setShowCreateModal(true)} />
      {/* TODO: Modal สร้างกิจกรรม (สามารถนำ modal จาก Home มาใช้ซ้ำได้) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl font-black mb-8">Coming Soon</h1>
      </main>
    </div>
  );
};

export default MyTrips;
