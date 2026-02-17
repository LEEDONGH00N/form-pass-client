// src/pages/guest/GuestLookupPage.tsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, Ticket, User, Phone, Loader2, ChevronLeft, AlertCircle } from 'lucide-react';

const API_HOST = process.env.NODE_ENV === 'production' ? 'https://api.form-pass.life' : 'http://localhost:8080';

// API 응답 타입 정의 (리스트 내 항목)
interface ReservationLookupResponse {
    qrToken: string;
    eventTitle: string;
    guestName: string;
    createdAt: string;
}

const GuestLookupPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

      // 백엔드 조회 API 호출
      const response = await axios.post<ReservationLookupResponse[]>(`${API_HOST}/api/reservations/lookup`, {
        guestName: name,
        guestPhoneNumber: phone.replace(/-/g, '') // 하이픈 제거 전송
      });

      const reservations = response.data;

      // 배열(List) 처리 로직
      if (Array.isArray(reservations) && reservations.length > 0) {
          const latestTicket = reservations[0];

          // 토큰 저장 후 이동
          localStorage.setItem('guest_token', latestTicket.qrToken);
          navigate(`/ticket/${latestTicket.qrToken}`);
      } else {
          setErrorMsg('일치하는 예매 내역이 없습니다.');
      }

    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setErrorMsg('일치하는 예매 내역이 없습니다.');
      } else {
        setErrorMsg('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col justify-center items-center font-[Pretendard] px-6 relative overflow-hidden">

      {/* 배경 장식 요소 */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-20 -right-32 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      <div className="absolute top-6 left-6 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-xl transition-all"><ChevronLeft size={28} /></button>
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-blue-200/50 mb-6 hover:scale-105 transition-transform cursor-default">
            <Ticket className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">예매 내역 조회</h1>
          <p className="text-gray-500 text-sm">
            예매 시 입력한 정보를 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleLookup} className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-blue-100/50 border border-white/50 hover:shadow-xl hover:shadow-blue-200/30 transition-all">

          {/* 이름 입력 */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">이름</label>
            <div className="relative flex items-center group">
                <User className="absolute left-4 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200/80 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white block pl-12 p-3.5 transition-all outline-none"
                    placeholder="홍길동"
                />
            </div>
          </div>

          {/* 휴대폰 번호 입력 */}
          <div className="mb-8">
            <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">휴대폰 번호</label>
            <div className="relative flex items-center group">
                <Phone className="absolute left-4 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={13}
                    className="w-full bg-gray-50/50 border border-gray-200/80 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white block pl-12 p-3.5 transition-all outline-none"
                    placeholder="010-0000-0000"
                />
            </div>
          </div>

          {/* 에러 메시지 */}
          {errorMsg && (
            <div className="mb-6 p-3.5 bg-gradient-to-r from-red-50 to-red-100/50 text-red-600 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 border border-red-100">
                <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {/* 조회 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold rounded-xl text-lg px-5 py-4 text-center transition-all shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 hover:-translate-y-0.5 active:scale-[0.98] disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center gap-2"
          >
            {isLoading ? (
                <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    조회 중...
                </>
            ) : (
                <>
                    <Search className="w-5 h-5" />
                    내 티켓 찾기
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuestLookupPage;
