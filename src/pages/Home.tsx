import React, { useState, useEffect } from 'react';
import FilterBar from '../components/FilterBar';
import { Trip } from '../types';
import { TripCard } from '../components/TripCard';
import { TripDetails } from '../components/TripDetails';
import { tripsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TRIP_CATEGORIES } from '../constants/categories';
import Loader from '../components/Loader';

const PROVINCES = [
  'ทุกจังหวัด', 'กรุงเทพฯ', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
];

const CATEGORIES_FILTER = ['ทุกหมวดหมู่', ...TRIP_CATEGORIES.map(c => c.label)];

const Home: React.FC = () => {
  const { user } = useAuth();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('แนะนำ');

  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('ทุกจังหวัด');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('ทุกหมวดหมู่');

  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripsAPI.getAll();
      setTrips(response.trips || []);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch trips:', err);
      setError('ไม่สามารถโหลดข้อมูลกิจกรรมได้');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const searchMatch = !searchText ||
      trip.title.toLowerCase().includes(searchText.toLowerCase()) ||
      trip.description?.toLowerCase().includes(searchText.toLowerCase());
    const provinceMatch = selectedProvince === 'ทุกจังหวัด' || trip.destination.includes(selectedProvince);
    const dateMatch = !selectedDate || trip.startDate.split('T')[0] === selectedDate;
    const categoryMatch = selectedCategory === 'ทุกหมวดหมู่' || trip.category === selectedCategory;

    return searchMatch && provinceMatch && dateMatch && categoryMatch;
  }).sort((a, b) => {
    if (activeTab === 'ยอดนิยม') {
      const countA = a.participants?.length || 0;
      const countB = b.participants?.length || 0;
      return countB - countA;
    }

    if (activeTab === 'แนะนำ') {
      const userInterests = user?.interests || [];
      // Check if trip category is in user interests
      const aMatch = userInterests.includes(a.category) ? 1 : 0;
      const bMatch = userInterests.includes(b.category) ? 1 : 0;

      // Prioritize matched interests
      if (aMatch !== bMatch) {
        return bMatch - aMatch;
      }

      // Secondary sort: Popularity or Recency
      return (b.participants?.length || 0) - (a.participants?.length || 0);
    }

    return 0;
  });

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return 'เลือกวันที่';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  };


  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#121212]">


      {selectedTrip ? (
        <TripDetails trip={selectedTrip} onBack={() => setSelectedTrip(null)} />
      ) : (
        <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-32 pb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <header className="space-y-4">
              <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-widest">beta version</div>
              <h1 className="text-6xl md:text-7xl font-black text-black tracking-tighter leading-[0.85]">
                Enjoy with<br />us.
              </h1>
              <p className="text-gray-400 text-lg font-medium max-w-md">
                ค้นหากิจกรรมที่คุณสนใจและทำความรู้จักกับเพื่อนใหม่ในสไตล์ที่เป็นคุณ
              </p>
            </header>

            {/* Search Box & Tabs */}
            <div className="flex flex-col items-end gap-4 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative w-full md:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black sm:text-sm transition-all shadow-sm group-hover:shadow-md"
                  placeholder="ค้นหาทริป... (เช่น เดินป่า, คาเฟ่)"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <div className="flex gap-1 p-1 bg-gray-100 rounded-full">
                {['แนะนำ', 'มาใหม่', 'ยอดนิยม'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <FilterBar
            provinces={PROVINCES}
            categories={CATEGORIES_FILTER}
            selectedProvince={selectedProvince}
            setSelectedProvince={setSelectedProvince}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            showProvinceDropdown={showProvinceDropdown}
            setShowProvinceDropdown={setShowProvinceDropdown}
            showCategoryDropdown={showCategoryDropdown}
            setShowCategoryDropdown={setShowCategoryDropdown}
            formatDateLabel={formatDateLabel}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
            {loading ? (
              // Display New Loader
              <div className="col-span-full">
                <Loader />
              </div>
            ) : error ? (
              <div className="col-span-full py-20 text-center border border-dashed border-red-200 rounded-3xl bg-red-50">
                <p className="text-red-600 font-medium mb-4">{error}</p>
                <button
                  onClick={fetchTrips}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  ลองอีกครั้ง
                </button>
              </div>
            ) : filteredTrips.length > 0 ? (
              filteredTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center border border-dashed border-gray-200 rounded-3xl">
                <p className="text-gray-400 font-medium">ไม่พบกิจกรรมในเงื่อนไขที่ระบุ ลองเปลี่ยนเงื่อนไขการค้นหาดูนะ</p>
                <button onClick={() => { setSelectedProvince('ทุกจังหวัด'); setSelectedDate(''); setSelectedCategory('ทุกหมวดหมู่'); setSearchText(''); }} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">ล้างตัวกรองทั้งหมด</button>
              </div>
            )}
          </div>
        </main>
      )}

      <footer className="py-20 bg-black text-white mt-auto">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-black rounded-full"></div></div>
              <span className="font-bold text-2xl tracking-tighter">GoWithUs.</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs font-medium leading-relaxed">แพลตฟอร์มที่เชื่อมโยงผู้คนมาเป็นเพื่อนกัน</p>
          </div>
          <div className="flex gap-16 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            <div className="flex flex-col gap-4">
              <span className="text-white mb-2">-</span>
              <a href="#" className="hover:text-indigo-400 transition-colors">-</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">-</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-white mb-2">-</span>
              <a href="#" className="hover:text-indigo-400 transition-colors">-</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">-</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
