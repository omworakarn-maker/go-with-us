import React, { useRef } from 'react';

interface FilterBarProps {
  provinces: string[];
  categories: string[];
  selectedProvince: string;
  setSelectedProvince: (province: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  showProvinceDropdown: boolean;
  setShowProvinceDropdown: (show: boolean) => void;
  showCategoryDropdown: boolean;
  setShowCategoryDropdown: (show: boolean) => void;
  formatDateLabel: (date: string) => string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  provinces,
  categories,
  selectedProvince,
  setSelectedProvince,
  selectedDate,
  setSelectedDate,
  selectedCategory,
  setSelectedCategory,
  showProvinceDropdown,
  setShowProvinceDropdown,
  showCategoryDropdown,
  setShowCategoryDropdown,
  formatDateLabel,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleDateButtonClick = () => {
    if (dateInputRef.current) {
      try {
        if ('showPicker' in dateInputRef.current) {
          (dateInputRef.current as any).showPicker();
        } else {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      } catch (error) {
        dateInputRef.current.focus();
      }
    }
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDate('');
  };

  return (
    <div className="flex flex-wrap gap-3 overflow-visible mb-12 relative">
      {/* Province Selector */}
      <div className="relative">
        <button onClick={() => setShowProvinceDropdown(!showProvinceDropdown)} className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-gray-200 text-xs font-bold text-gray-600 shadow-sm hover:border-black transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {selectedProvince}
          <svg className={`w-3 h-3 transition-transform ${showProvinceDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showProvinceDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowProvinceDropdown(false)}></div>
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              <div className="max-h-80 overflow-y-auto no-scrollbar">
                {provinces.map((province) => (
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
      <div className="relative">
        <button
          type="button"
          onClick={handleDateButtonClick}
          className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-gray-200 text-xs font-bold text-gray-600 shadow-sm hover:border-black transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDateLabel(selectedDate)}</span>
          {selectedDate && (
            <button
              type="button"
              onClick={handleClearDate}
              className="ml-1 text-gray-300 hover:text-black transition-colors"
            >
              ✕
            </button>
          )}
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="absolute opacity-0 pointer-events-none"
          style={{ width: 0, height: 0 }}
        />
      </div>

      {/* Category Selector - Compact Dropdown Logic */}
      <div className="relative">
        <button onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-xs font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          {selectedCategory}
          <svg className={`w-3 h-3 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showCategoryDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)}></div>
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              <div className="max-h-80 overflow-y-auto no-scrollbar">
                {categories.map((cat) => (
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
