import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Calendar, MapPin, Loader2, Plus, Image as ImageIcon, Check, Zap, LogOut } from 'lucide-react';
import { showError, showWarning } from '../../constants/swalTheme';
import { authAxios, getAccessToken, authApi } from '../../api/authApi';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_HOST = IS_PRODUCTION ? 'https://api.form-pass.life' : 'http://localhost:8080';
const EVENTS_API_URL = `${API_HOST}/api/host/events`;

interface Event {
  id: number;
  title: string;
  eventCode: string;
  location?: string;
  images?: string[];
  thumbnailUrl?: string;
  description?: string;
  isPublic: boolean;
  startDate?: string;
  endDate?: string;
}

const EventCard: React.FC<{ event: Event; currentDomain: string }> = ({ event, currentDomain }) => {
  const navigate = useNavigate();
  const [isPublic, setIsPublic] = useState(event.isPublic);
  const [copied, setCopied] = useState(false);

  const displayThumbnail = (event.images && event.images.length > 0)
    ? event.images[0]
    : event.thumbnailUrl;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl = `${currentDomain}/${event.eventCode}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isPublic;
    setIsPublic(newState);

    try {
      await authAxios.patch(
        `${API_HOST}/api/host/events/${event.id}/visibility`,
        { isPublic: newState }
      );
    } catch (error) {
      console.error('상태 변경 실패:', error);
      setIsPublic(!newState);
      await showError('변경 실패', '상태 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/host/events/${event.id}`)}
    >
      {/* 썸네일 */}
      <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
        {displayThumbnail ? (
          <img
            src={displayThumbnail}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* 공개 상태 뱃지 */}
        <div className={`absolute top-3 right-3 px-3 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md ${
          isPublic
            ? 'bg-blue-500/90 text-white'
            : 'bg-white/90 text-gray-600 border border-gray-200'
        }`}>
          {isPublic ? '공개' : '비공개'}
        </div>
      </div>

      {/* 정보 */}
      <div className="p-5">
        <h2 className="font-bold text-gray-900 text-lg mb-3 truncate group-hover:text-blue-600 transition-colors">
          {event.title}
        </h2>

        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1.5">
          <MapPin size={14} className="text-gray-400" />
          <span className="truncate">{event.location || '장소 미정'}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-400 text-xs mb-5">
          <Calendar size={12} />
          <span>{event.startDate || '날짜 미정'}</span>
        </div>

        {/* 링크 복사 */}
        <div className="flex items-center gap-2 mb-5" onClick={(e) => e.stopPropagation()}>
          <div className="flex-1 px-3 py-2.5 bg-gray-50 rounded-lg text-xs text-gray-500 font-mono truncate border border-gray-100">
            {currentDomain}/{event.eventCode}
          </div>
          <button
            onClick={handleCopyLink}
            className={`p-2.5 rounded-lg transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-blue-500 hover:text-white'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {/* 하단 액션 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/host/edit/${event.id}`);
            }}
            className="text-sm text-gray-500 font-medium hover:text-blue-600 transition-colors"
          >
            수정하기
          </button>

          {/* 토글 */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-gray-400">{isPublic ? '공개' : '비공개'}</span>
            <button
              onClick={handleToggle}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isPublic ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  isPublic ? 'translate-x-5' : ''
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
  const [isLoading, setIsLoading] = useState(true);
  const currentDomain = window.location.origin;

  const handleLogout = () => {
    authApi.logout();
    navigate('/');
  };

  useEffect(() => {
    const fetchEvents = async () => {
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
          await showWarning('로그인 필요', '다시 로그인해주세요.');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 font-[Pretendard]">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Form PASS</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/host/create')}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              <Plus size={18} />
              새 이벤트
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="로그아웃"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">내 이벤트</h2>
            <p className="text-gray-500 mt-1">총 {events.length}개의 이벤트</p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">아직 이벤트가 없습니다</h3>
            <p className="text-gray-500 mb-8">첫 번째 이벤트를 만들어보세요</p>
            <button
              onClick={() => navigate('/host/create')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
            >
              <Plus size={20} />
              첫 이벤트 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
