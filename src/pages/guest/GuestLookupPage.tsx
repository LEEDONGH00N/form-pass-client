import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  User,
  Phone,
  Loader2,
  ChevronLeft,
  AlertCircle,
  Zap,
  Ticket,
  Calendar,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

const API_HOST = process.env.NODE_ENV === 'production' ? 'https://api.form-pass.life' : 'http://localhost:8080';

interface ReservationLookupResponse {
  qrToken: string;
  eventTitle: string;
  guestName: string;
  ticketCount: number;
  createdAt: string;
}

const GuestLookupPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [reservations, setReservations] = useState<ReservationLookupResponse[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setPhone(formatted);
    setErrorMsg('');
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || phone.length < 12) {
      setErrorMsg('이름과 휴대폰 번호를 정확히 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');

      const response = await axios.post<ReservationLookupResponse[]>(`${API_HOST}/api/reservations/lookup`, {
        guestName: name,
        guestPhoneNumber: phone.replace(/-/g, '')
      });

      const data = response.data;
      setHasSearched(true);

      if (Array.isArray(data) && data.length > 0) {
        setReservations(data);
      } else {
        setReservations([]);
        setErrorMsg('일치하는 예매 내역이 없습니다.');
      }

    } catch (err: any) {
      console.error(err);
      setHasSearched(true);
      setReservations([]);
      if (err.response && err.response.status === 404) {
        setErrorMsg('일치하는 예매 내역이 없습니다.');
      } else {
        setErrorMsg('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setHasSearched(false);
    setReservations([]);
    setErrorMsg('');
    setName('');
    setPhone('');
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hour}:${minute}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col justify-center items-center font-[Pretendard] px-6 py-12 relative">
      {/* 배경 장식 */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* 뒤로가기 */}
      <div className="absolute top-6 left-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">뒤로</span>
        </button>
      </div>

      <div className="w-full max-w-md relative">
        {/* 로고 */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Search className="text-white w-7 h-7" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {hasSearched && reservations.length > 0 ? '내 티켓 목록' : '예매 내역 조회'}
          </h1>
          <p className="text-gray-500">
            {hasSearched && reservations.length > 0
              ? `${name}님의 티켓 ${reservations.length}건`
              : '예매 시 입력한 정보를 입력해주세요'
            }
          </p>
        </div>

        {/* 검색 결과가 있으면 티켓 목록 표시 */}
        {hasSearched && reservations.length > 0 ? (
          <div className="space-y-4">
            {/* 다시 검색 버튼 */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
            >
              <RotateCcw size={16} />
              <span className="text-sm font-medium">다른 정보로 검색</span>
            </button>

            {/* 티켓 목록 */}
            <div className="space-y-3">
              {reservations.map((reservation, index) => (
                <button
                  key={reservation.qrToken}
                  onClick={() => navigate(`/ticket/${reservation.qrToken}`)}
                  className="w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-5 text-left hover:shadow-xl hover:-translate-y-0.5 transform transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* 이벤트 제목 */}
                      <h3 className="font-bold text-gray-900 text-lg mb-2 truncate group-hover:text-blue-600 transition-colors">
                        {reservation.eventTitle}
                      </h3>

                      {/* 예매 정보 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Ticket size={14} className="text-blue-500" />
                          <span>{reservation.ticketCount}매</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar size={14} className="text-blue-500" />
                          <span>예매일: {formatDate(reservation.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* 화살표 */}
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors ml-4">
                      <ChevronRight size={20} className="text-blue-500" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* 검색 폼 */
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white p-8">
            <form onSubmit={handleLookup} className="space-y-5">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50/50"
                    placeholder="홍길동"
                  />
                </div>
              </div>

              {/* 연락처 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">휴대폰 번호</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={13}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50/50"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              {/* 에러 메시지 */}
              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">{errorMsg}</span>
                </div>
              )}

              {/* 조회 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transform"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    조회 중...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    내 티켓 찾기
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 홈 링크 */}
        <p className="mt-8 text-center text-gray-500">
          <Link to="/" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline flex items-center justify-center gap-1">
            <Zap size={16} />
            Form PASS 홈으로
          </Link>
        </p>
      </div>
    </div>
  );
};

export default GuestLookupPage;
