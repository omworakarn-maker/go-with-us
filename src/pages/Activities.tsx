import React, { useState } from 'react';
import { Link } from 'react-router-dom';


import ActivityCreate from '../components/ActivityCreate';

const Activities: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#121212]">

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl font-black mb-8">Coming Soon</h1>
      </main>
    </div>
  );
};

export default Activities;
