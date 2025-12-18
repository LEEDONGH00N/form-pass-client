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
      // 응답 형식: ReservationLookupResponse[] (배열)
      const response = await axios.post<ReservationLookupResponse[]>(`${API_HOST}/api/reservations/lookup`, {
        guestName: name,
        guestPhoneNumber: phone.replace(/-/g, '') // 하이픈 제거 전송
      });

      const reservations = response.data;

      // 🔥 [수정] 배열(List) 처리 로직
      // 결과가 존재하면 가장 첫 번째(최신) 티켓으로 이동합니다.
      if (Array.isArray(reservations) && reservations.length > 0) {
          // 백엔드에서 최신순(DESC)으로 정렬해 준다고 가정하고 0번 인덱스 사용
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-[Pretendard] px-6">
      <div className="absolute top-6 left-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800"><ChevronLeft size={28} /></button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 mb-6">
            <Ticket className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">예매 내역 조회</h1>
          <p className="text-gray-500 text-sm">
            예매 시 입력한 정보를 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleLookup} className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-white">
          
          {/* 이름 입력 */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">이름</label>
            <div className="relative flex items-center">
                <User className="absolute left-4 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block pl-12 p-3.5 transition-all outline-none" 
                    placeholder="홍길동"
                />
            </div>
          </div>

          {/* 휴대폰 번호 입력 */}
          <div className="mb-8">
            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">휴대폰 번호</label>
            <div className="relative flex items-center">
                <Phone className="absolute left-4 text-gray-400 w-5 h-5" />
                <input 
                    type="tel" 
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={13}
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block pl-12 p-3.5 transition-all outline-none" 
                    placeholder="010-0000-0000"
                />
            </div>
          </div>

          {/* 에러 메시지 */}
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 text-red-500 text-xs font-bold rounded-lg text-center flex items-center justify-center gap-2 animate-pulse">
                <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {/* 조회 버튼 */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-bold rounded-xl text-lg px-5 py-4 text-center transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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