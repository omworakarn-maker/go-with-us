import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FilterBar from '../components/FilterBar';
import { Trip } from '../types';
import { TripCard } from '../components/TripCard';
import { TripDetails } from '../components/TripDetails';
import { tripsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TRIP_CATEGORIES } from '../constants/categories'; // Import categories

const PROVINCES = [
  'ทุกจังหวัด', 'กรุงเทพฯ', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
];

// Map categories for filter (add 'All')
const CATEGORIES_FILTER = ['ทุกหมวดหมู่', ...TRIP_CATEGORIES.map(c => c.label)];

const Home: React.FC = () => {
  const { user } = useAuth();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('แนะนำ');

  // Filters
  const [searchText, setSearchText] = useState(''); // New Search State
  const [selectedProvince, setSelectedProvince] = useState('ทุกจังหวัด');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('ทุกหมวดหมู่');

  const [newTrip, setNewTrip] = useState({
    title: '',
    destination: PROVINCES[1],
    description: '',
    startDate: '',
    endDate: '',
    category: TRIP_CATEGORIES[0].label, // Use first category as default
    budget: 'Budget' as 'Budget' | 'Moderate' | 'Luxury',
    maxParticipants: 10,
    imageUrl: '',
  });

  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [creating, setCreating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Fetch trips on mount
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
    const dateMatch = !selectedDate || trip.startDate === selectedDate;
    const categoryMatch = selectedCategory === 'ทุกหมวดหมู่' || trip.category === selectedCategory;

    return searchMatch && provinceMatch && dateMatch && categoryMatch;
  });

  // ... (Keep existing handlers handleDeleteTrip, handleImageUpload, removeImage, formatDateLabel) ...
  const handleDeleteTrip = async (id: string) => {
    try {
      await tripsAPI.delete(id);
      setTrips(trips.filter(trip => trip.id !== id));
    } catch (err: any) {
      console.error('Failed to delete trip:', err);
      alert('ไม่สามารถลบกิจกรรมได้');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP)');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setNewTrip({ ...newTrip, imageUrl: base64String });
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setNewTrip({ ...newTrip, imageUrl: '' });
    setImagePreview('');
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return 'เลือกวันที่';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  };


  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#121212]">
      <Navbar onCreateActivity={() => setShowCreateModal(true)} />
      {selectedTrip ? (
        <TripDetails trip={selectedTrip} onBack={() => setSelectedTrip(null)} />
      ) : (
        <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-32 pb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <header className="space-y-4">
              <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-widest">beta test</div>
              <h1 className="text-6xl md:text-7xl font-black text-black tracking-tighter leading-[0.85]">ไปกับเรา<br />สนุกกว่า.</h1>
              <p className="text-gray-400 text-lg font-medium max-w-md">ค้นหากิจกรรมที่คุณสนใจและทำความรู้จักกับเพื่อนใหม่ในสไตล์ที่เป็นคุณ</p>
            </header>

            {/* Search Box & Tabs */}
            <div className="flex flex-col items-end gap-4 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative w-full md:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {loading ? (
              <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-medium">กำลังโหลดกิจกรรม...</p>
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
            <p className="text-sm text-gray-400 max-w-xs font-medium leading-relaxed">แพลตฟอร์มที่เชื่อมโยงผู้คนผ่านการเดินทางและกิจกรรมที่คัดสรรมาเพื่อคุณโดยเฉพาะ</p>
          </div>
          <div className="flex gap-16 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            <div className="flex flex-col gap-4">
              <span className="text-white mb-2">ข้อมูล</span>
              <a href="#" className="hover:text-indigo-400 transition-colors">ความเป็นส่วนตัว</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">ข้อกำหนด</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-white mb-2">ช่วยเหลือ</span>
              <a href="#" className="hover:text-indigo-400 transition-colors">ติดต่อเรา</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">คำถามที่พบบ่อย</a>
            </div>
          </div>
        </div>
      </footer>
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/95 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl p-12 overflow-y-auto max-h-screen no-scrollbar">
            <div className="flex justify-between items-center mb-16">
              <h2 className="text-5xl font-black tracking-tight text-black">สร้างกิจกรรม.</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-black hover:border-black transition-all">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();

              if (!user) {
                alert('กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรม');
                return;
              }

              try {
                setCreating(true);
                const response = await tripsAPI.create({
                  title: newTrip.title,
                  destination: newTrip.destination,
                  description: newTrip.description,
                  startDate: newTrip.startDate,
                  endDate: newTrip.endDate || newTrip.startDate,
                  budget: newTrip.budget,
                  maxParticipants: newTrip.maxParticipants,
                  category: newTrip.category,
                  imageUrl: newTrip.imageUrl,
                });

                // Add new trip to list
                await fetchTrips(); // Refresh trips list
                setShowCreateModal(false);
                setNewTrip({ title: '', destination: PROVINCES[1], description: '', startDate: '', endDate: '', category: TRIP_CATEGORIES[0].label, budget: 'Budget', maxParticipants: 10, imageUrl: '' });
                setImagePreview('');
              } catch (err: any) {
                console.error('Failed to create trip:', err);
                alert(err.message || 'ไม่สามารถสร้างกิจกรรมได้');
              } finally {
                setCreating(false);
              }
            }} className="space-y-10">
              <div className="space-y-2 border-b border-gray-200 pb-2">
                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest">ชื่อทริปหรือกิจกรรม</label>
                <input required className="w-full bg-transparent border-none p-0 text-2xl font-bold focus:ring-0 outline-none placeholder:text-gray-100" placeholder="ระบุชื่อกิจกรรมที่นี่..." value={newTrip.title} onChange={e => setNewTrip({ ...newTrip, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-2 border-b border-gray-200 pb-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest">สถานที่</label>
                  <select required className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 outline-none appearance-none" value={newTrip.destination} onChange={e => setNewTrip({ ...newTrip, destination: e.target.value })}>
                    {PROVINCES.filter(p => p !== 'ทุกจังหวัด').map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 border-b border-gray-200 pb-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest">หมวดหมู่</label>
                  <select required className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 outline-none appearance-none" value={newTrip.category} onChange={e => setNewTrip({ ...newTrip, category: e.target.value })}>
                    {TRIP_CATEGORIES.map(c => (
                      <option key={c.id} value={c.label}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-2 border-b border-gray-200 pb-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest">วันที่เริ่ม</label>
                  <input required type="date" className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 outline-none" value={newTrip.startDate} onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })} />
                </div>
                <div className="space-y-2 border-b border-gray-200 pb-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest">วันที่สิ้นสุด</label>
                  <input type="date" className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 outline-none" value={newTrip.endDate} onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })} min={newTrip.startDate} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-2 border-b border-gray-200 pb-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest">งบประมาณ</label>
                  <select required className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 outline-none appearance-none" value={newTrip.budget} onChange={e => setNewTrip({ ...newTrip, budget: e.target.value as any })}>
                    <option value="Budget">ประหยัด</option>
                    <option value="Moderate">ปานกลาง</option>
                    <option value="Luxury">หรูหรา</option>
                  </select>
                </div>
                <div className="space-y-2 border-b border-gray-200 pb-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest">จำนวนคนสูงสุด</label>
                  <input required type="number" min="1" max="15" className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 outline-none" value={newTrip.maxParticipants} onChange={e => setNewTrip({ ...newTrip, maxParticipants: Math.min(15, Math.max(1, parseInt(e.target.value) || 1)) })} />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest">รูปภาพ (ไม่บังคับ)</label>

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-2xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="block">
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-all">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-600">คลิกเพื่อเลือกรูปภาพ</p>
                      <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP (สูงสุด 5MB)</p>
                    </div>
                  </label>
                )}
              </div>
              <div className="space-y-2 border-b border-gray-200 pb-2">
                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest">รายละเอียดสั้นๆ</label>
                <textarea rows={2} className="w-full bg-transparent border-none p-0 text-lg font-medium focus:ring-0 outline-none resize-none placeholder:text-gray-100" placeholder="อธิบายกิจกรรมให้เพื่อนๆ อยากเข้าร่วม..." value={newTrip.description} onChange={e => setNewTrip({ ...newTrip, description: e.target.value })} />
              </div>
              <div className="pt-8">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-5 bg-black text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังสร้าง...
                    </span>
                  ) : (
                    'บันทึกและประกาศกิจกรรม'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
