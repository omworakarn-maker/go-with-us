import React, { useState, useEffect } from 'react';
import { Trip } from './types';
import { TripCard } from './components/TripCard';
import { TripDetails } from './components/TripDetails';
import Navbar from './components/Navbar';
import { tripsAPI, userAPI } from './services/api';
import { useAuth } from './contexts/AuthContext';
import { InterestModal } from './components/InterestModal';
import CreateActivity from './pages/CreateActivity';

const PROVINCES = [
	'ทุกจังหวัด', 'กรุงเทพฯ', 'เชียงใหม่', 'ภูเก็ต', 'ชลบุรี', 'กระบี่',
	'กาญจนบุรี', 'ขอนแก่น', 'นครราชสีมา', 'ประจวบคีรีขันธ์', 'สุราษฎร์ธานี'
];

const CATEGORIES = [
	'ทุกหมวดหมู่', 'กินเที่ยว', 'กีฬา', 'ปาร์ตี้', 'ธรรมชาติ',
	'ถ่ายรูป', 'เวิร์กชอป', 'คอนเสิร์ต'
];

const App = () => {
	const { user } = useAuth();
	const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
	const [trips, setTrips] = useState<Trip[]>([]);
	const [loading, setLoading] = useState(true);

	// Filters & Tabs
	const [activeTab, setActiveTab] = useState<'แนะนำ' | 'มาใหม่' | 'ยอดนิยม'>('แนะนำ');
	const [selectedProvince, setSelectedProvince] = useState('ทุกจังหวัด');
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [selectedCategory, setSelectedCategory] = useState('ทุกหมวดหมู่');

	// UI States
	const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
	const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
	const [showInterestModal, setShowInterestModal] = useState(false);

	useEffect(() => {
		checkUserInterests();
	}, [user]);

	useEffect(() => {
		fetchTrips();
	}, [activeTab, selectedProvince, selectedCategory, selectedDate]);

	const checkUserInterests = async () => {
		if (user) {
			try {
				const profile = await userAPI.getProfile();
				// If user has no interests saved, show modal
				if (!profile.interests || profile.interests.length === 0) {
					setShowInterestModal(true);
				}
			} catch (error) {
				console.error('Error checking interests:', error);
			}
		}
	};

	const fetchTrips = async () => {
		try {
			setLoading(true);
			const filters: any = {};

			if (selectedProvince !== 'ทุกจังหวัด') filters.destination = selectedProvince;
			if (selectedCategory !== 'ทุกหมวดหมู่') filters.category = selectedCategory;
			if (selectedDate) filters.startDate = selectedDate;

			// Map tab to API type
			if (activeTab === 'ยอดนิยม') filters.type = 'popular';
			else if (activeTab === 'แนะนำ') filters.type = 'recommended';
			else filters.type = 'new'; // Default

			const data = await tripsAPI.getAll(filters);
			setTrips(data.trips);
		} catch (error) {
			console.error('Failed to fetch trips:', error);
		} finally {
			setLoading(false);
		}
	};

	const formatDateLabel = (dateStr: string) => {
		if (!dateStr) return 'เลือกวันที่';
		const date = new Date(dateStr);
		return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
	};

	return (
		<div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#121212] pb-20">
			<Navbar />

			<InterestModal
				isOpen={showInterestModal}
				onClose={() => setShowInterestModal(false)}
				onSave={() => {
					setShowInterestModal(false);
					// Refresh trips if on recommended tab
					if (activeTab === 'แนะนำ') fetchTrips();
				}}
			/>

			<main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-32">
				{!selectedTrip ? (
					<div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
						{/* Header Section */}
						<div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
							<header className="space-y-4">
								<div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-widest">
									ประสบการณ์ใหม่
								</div>
								<h1 className="text-6xl md:text-7xl font-black text-black tracking-tighter leading-[0.85]">
									ไปกับเรา<br />สนุกกว่า.
								</h1>
								<p className="text-gray-400 text-lg font-medium max-w-md">
									ค้นหากิจกรรมที่คุณสนใจและทำความรู้จักกับเพื่อนใหม่ในสไตล์ที่เป็นคุณ
								</p>
							</header>

							<div className="flex gap-1 p-1 bg-gray-100 rounded-full overflow-x-auto max-w-full">
								{(['แนะนำ', 'มาใหม่', 'ยอดนิยม'] as const).map((tab) => (
									<button
										key={tab}
										onClick={() => setActiveTab(tab)}
										className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab
											? 'bg-white text-black shadow-sm'
											: 'text-gray-400 hover:text-gray-600'
											}`}
									>
										{tab}
									</button>
								))}
							</div>
						</div>

						{/* Filters Section */}
						<div className="flex flex-wrap gap-3 overflow-visible mb-12 relative z-30">
							{/* Province Selector */}
							<div className="relative">
								<button
									onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
									className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-gray-200 text-xs font-bold text-gray-600 shadow-sm hover:border-black transition-all"
								>
									📍 {selectedProvince}
									<svg className={`w-3 h-3 transition-transform ${showProvinceDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
								</button>

								{showProvinceDropdown && (
									<>
										<div className="fixed inset-0 z-10" onClick={() => setShowProvinceDropdown(false)}></div>
										<div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
											<div className="max-h-80 overflow-y-auto">
												{PROVINCES.map((province) => (
													<button
														key={province}
														onClick={() => {
															setSelectedProvince(province);
															setShowProvinceDropdown(false);
														}}
														className={`w-full text-left px-6 py-3 text-xs font-bold transition-colors hover:bg-gray-50 ${selectedProvince === province ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-600'}`}
													>
														{province}
													</button>
												))}
											</div>
										</div>
									</>
								)}
							</div>

							{/* Date Selector */}
							<div className="relative group">
								<div className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-gray-200 text-xs font-bold text-gray-600 shadow-sm hover:border-black transition-all">
									📅 {formatDateLabel(selectedDate)}
									<input
										type="date"
										value={selectedDate}
										onChange={(e) => setSelectedDate(e.target.value)}
										className="absolute inset-0 opacity-0 cursor-pointer w-full"
									/>
									{selectedDate && (
										<button onClick={(e) => { e.stopPropagation(); setSelectedDate(''); }} className="ml-1 text-gray-300 hover:text-black">✕</button>
									)}
								</div>
							</div>

							{/* Category Selector */}
							<div className="relative">
								<button
									onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
									className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-xs font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-all"
								>
									✨ {selectedCategory}
									<svg className={`w-3 h-3 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
								</button>

								{showCategoryDropdown && (
									<>
										<div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)}></div>
										<div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
											{CATEGORIES.map((cat) => (
												<button
													key={cat}
													onClick={() => {
														setSelectedCategory(cat);
														setShowCategoryDropdown(false);
													}}
													className={`w-full text-left px-6 py-3 text-xs font-bold transition-colors hover:bg-gray-50 ${selectedCategory === cat ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-600'}`}
												>
													{cat}
												</button>
											))}
										</div>
									</>
								)}
							</div>
						</div>

						{/* Trips Grid */}
						{loading ? (
							<div className="flex justify-center py-20">
								<div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
								{trips.length > 0 ? (
									trips.map((trip) => (
										<TripCard key={trip.id} trip={trip} onClick={setSelectedTrip} />
									))
								) : (
									<div className="col-span-full py-20 text-center border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
										<p className="text-gray-400 font-medium">
											ไม่พบกิจกรรมในตอนนี้ ลองเปลี่ยนเงื่อนไขการค้นหาดูนะ
										</p>
										<button
											onClick={() => {
												setSelectedProvince('ทุกจังหวัด');
												setSelectedDate('');
												setSelectedCategory('ทุกหมวดหมู่');
												setActiveTab('มาใหม่');
											}}
											className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
										>
											ดูทริปมาใหม่ทั้งหมด
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				) : (
					<TripDetails trip={selectedTrip} onBack={() => setSelectedTrip(null)} />
				)}
			</main>
		</div>
	);
};

export default App;
