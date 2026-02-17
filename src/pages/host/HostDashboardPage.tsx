// src/pages/host/HostDashboardPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Calendar, MapPin, Loader2, Plus, Ticket } from 'lucide-react';
import Swal from 'sweetalert2';
import { authAxios, getAccessToken } from '../../api/authApi';

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
      await Swal.fire({
        icon: 'success',
        title: '복사 완료',
        text: '링크가 복사되었습니다!',
        confirmButtonColor: '#3B82F6',
        confirmButtonText: '확인',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isPublic;
    setIsPublic(newState); // 낙관적 업데이트

    try {
      await authAxios.patch(
        `${API_HOST}/api/host/events/${event.id}/visibility`,
        { isPublic: newState }
      );
    } catch (error) {
      console.error('상태 변경 실패:', error);
      setIsPublic(!newState); // 실패 시 롤백
      await Swal.fire({
        icon: 'error',
        title: '변경 실패',
        text: '상태 변경 중 오류가 발생했습니다.',
        confirmButtonColor: '#3B82F6',
        confirmButtonText: '확인'
      });
    }
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-blue-100/30 hover:-translate-y-1 hover:border-blue-200/50 transition-all duration-300 group flex flex-col cursor-pointer"
      onClick={handleEventClick}
    >
      {/* 썸네일 영역 */}
      <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden shrink-0">
        {displayThumbnail ? (
          <img
            src={displayThumbnail}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-50">
            <Ticket className="w-12 h-12 opacity-30" />
          </div>
        )}
        {/* 공개/비공개 배지 */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md transition-all ${
          isPublic
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
            : 'bg-white/80 text-gray-600 border border-gray-200'
        }`}>
          {isPublic ? '공개' : '비공개'}
        </div>
      </div>

      {/* 정보 영역 */}
      <div className="p-5 flex flex-col flex-1">
        <h2 className="font-bold text-lg text-slate-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
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
          <label className="text-xs text-slate-400 font-semibold mb-1.5 block">이벤트 링크</label>
          <div className="flex items-center bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-2.5 border border-slate-200/80 hover:border-blue-200 hover:shadow-sm transition-all group/link">
            <div className="text-xs text-slate-600 truncate flex-1 mr-2 font-mono">
              {currentDomain}/{event.eventCode}
            </div>
            <button
              onClick={handleCopyLink}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="링크 복사"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleEditEvent}
            className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
          >
            수정하기
          </button>

          {/* 토글 스위치 */}
          <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
            {/* 텍스트 */}
            <span className={`text-xs font-bold w-10 text-center transition-colors ${isPublic ? 'text-blue-600' : 'text-gray-400'}`}>
              {isPublic ? '공개' : '비공개'}
            </span>
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none ${
                isPublic
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-md shadow-blue-200/50'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
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
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      if (!getAccessToken()) {
        navigate('/login');
        return;
      }

      try {
        const response = await authAxios.get<Event[]>(EVENTS_API_URL);
        setEvents(response.data);
      } catch (error: any) {
        console.error('이벤트 목록 불러오기 실패:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          await Swal.fire({
            icon: 'warning',
            title: '로그인 필요',
            text: '로그인이 필요합니다.',
            confirmButtonColor: '#3B82F6',
            confirmButtonText: '확인'
          });
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-blue-600 font-bold text-xl flex items-center gap-3">
          <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-gray-50 min-h-screen font-[Pretendard]">
      {/* 헤더 - Glassmorphism 효과 */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/50 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
        <div
          className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent cursor-pointer"
          onClick={() => navigate('/')}
        >
          Form PASS
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 font-medium bg-gray-100/80 px-3 py-1 rounded-lg">관리자 모드</span>
          <button
            onClick={() => navigate('/host/create')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-2"
          >
            <Plus size={18} /> 새 이벤트 만들기
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
          내 이벤트 목록
          <span className="bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 text-sm px-3 py-1 rounded-full border border-blue-100 font-bold">
            {events.length}
          </span>
        </h1>

        {events.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-16 text-center border-2 border-dashed border-gray-200 hover:border-blue-200 transition-colors group">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center group-hover:from-blue-100 group-hover:to-cyan-100 transition-colors">
              <Ticket className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-gray-500 mb-6 text-lg">아직 생성된 이벤트가 없습니다.</p>
            <button
              onClick={() => navigate('/host/create')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 hover:-translate-y-0.5 active:scale-[0.98]"
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
