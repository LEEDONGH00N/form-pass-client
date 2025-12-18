// src/pages/host/HostDashboardPage.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Copy, Calendar, MapPin, Loader2 } from 'lucide-react';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_HOST = IS_PRODUCTION ? 'https://api.form-pass.life' : 'http://localhost:8080';
const EVENTS_API_URL = `${API_HOST}/api/host/events`;

// 백엔드 EventResponse에 맞춘 인터페이스
interface Event {
  id: number;
  title: string;
  eventCode: string;
  location?: string;
  images?: string[];     // 백엔드에서 리스트로 변경됨
  thumbnailUrl?: string; // 하위 호환용
  description?: string;
  isPublic: boolean;     // 공개 여부
  // startDate, endDate는 백엔드 스케줄 리스트에서 가져오거나 별도 필드로 온다고 가정
  startDate?: string; 
  endDate?: string;   
}

// 개별 이벤트 카드 컴포넌트
const EventCard: React.FC<{ event: Event; currentDomain: string }> = ({ event, currentDomain }) => {
  const navigate = useNavigate();
  // 초기 상태를 서버 데이터로 설정
  const [isPublic, setIsPublic] = useState(event.isPublic);

  // 썸네일 처리: images 배열의 첫 번째 요소 우선, 없으면 thumbnailUrl 사용
  const displayThumbnail = (event.images && event.images.length > 0) 
    ? event.images[0] 
    : event.thumbnailUrl;

  const handleEventClick = () => {
    navigate(`/host/events/${event.id}`);
  };

  const handleEditEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/host/edit/${event.id}`);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl = `${currentDomain}/${event.eventCode}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      alert('링크가 복사되었습니다!');
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isPublic;
    setIsPublic(newState); // 낙관적 업데이트

    try {
      const token = localStorage.getItem('accessToken');
      // API 경로 수정: /api/host/events/{id}/visibility (또는 /api/events/{id}/visibility 등 백엔드 설정에 맞춤)
      await axios.patch(
        `${API_HOST}/api/host/events/${event.id}/visibility`,
        { isPublic: newState },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('상태 변경 실패:', error);
      setIsPublic(!newState); // 실패 시 롤백
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col cursor-pointer"
      onClick={handleEventClick}
    >
      {/* 썸네일 영역 */}
      <div className="h-44 bg-gray-200 relative overflow-hidden shrink-0">
        {displayThumbnail ? (
          <img 
            src={displayThumbnail} 
            alt={event.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
            이미지 없음
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="p-5 flex flex-col flex-1">
        <h2 className="font-bold text-lg text-slate-800 mb-1 truncate group-hover:text-indigo-600 transition-colors">
          {event.title}
        </h2>
        
        <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
          <MapPin size={14} /> {event.location || '장소 미정'}
        </p>

        <div className="flex items-center text-slate-400 text-xs mb-4">
          <Calendar size={14} className="mr-1" />
          <span>
            {event.startDate || '날짜 미정'} 
            {event.endDate ? ` ~ ${event.endDate}` : ''}
          </span>
        </div>
        
        {/* 링크 복사 */}
        <div className="mt-auto mb-4" onClick={(e) => e.stopPropagation()}> 
            <label className="text-xs text-slate-400 font-semibold mb-1 block">이벤트 링크</label>
            <div className="flex items-center bg-slate-50 rounded-lg p-2 border border-slate-200 hover:border-indigo-200 transition-colors">
                <div className="text-xs text-slate-600 truncate flex-1 mr-2 font-mono">
                    {currentDomain}/{event.eventCode}
                </div>
                <button 
                    onClick={handleCopyLink}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                    title="링크 복사"
                >
                    <Copy size={16} />
                </button>
            </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-50">
            <button 
                onClick={handleEditEvent}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
            >
                수정하기
            </button>

            {/* 🔥 레이아웃 고정 수정됨 */}
            <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                {/* w-10 및 text-center로 텍스트 너비 고정 */}
                <span className={`text-xs font-bold w-10 text-center transition-colors ${isPublic ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {isPublic ? '공개' : '비공개'}
                </span>
                <button 
                    onClick={handleToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        isPublic ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isPublic ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const HostDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const currentDomain = window.location.origin;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          alert('로그인이 필요합니다.');
          navigate('/login');
          return;
        }

        const response = await axios.get<Event[]>(EVENTS_API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvents(response.data);
      } catch (error) {
        console.error('이벤트 목록 불러오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [navigate]);

  if (isLoading) {
    return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="text-indigo-600 font-bold text-xl flex items-center gap-2">
                <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
                불러오는 중...
            </div>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-[Pretendard]">
      <header className="bg-white border-b h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
        <div 
            className="text-xl font-extrabold text-indigo-600 cursor-pointer" 
            onClick={() => navigate('/')}
        >
            Form PASS
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 font-medium">관리자 모드</span>
            <button 
                onClick={() => navigate('/host/create')} 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-md hover:shadow-lg"
            >
                + 새 이벤트 만들기
            </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            내 이벤트 목록 <span className="bg-indigo-100 text-indigo-600 text-sm px-2 py-0.5 rounded-full">{events.length}</span>
        </h1>
        
        {events.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-gray-300 shadow-sm">
                <p className="text-gray-400 mb-6 text-lg">아직 생성된 이벤트가 없습니다.</p>
                <button 
                    onClick={() => navigate('/host/create')}
                    className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition"
                >
                    첫 번째 이벤트 만들기
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                    <EventCard key={event.id} event={event} currentDomain={currentDomain} />
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default HostDashboardPage;