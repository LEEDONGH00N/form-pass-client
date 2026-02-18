import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { showSuccess, showError, showConfirm } from '../../constants/swalTheme';
import {
  MapPin,
  Calendar,
  User,
  Loader2,
  Home,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_HOST = IS_PRODUCTION ? 'https://api.form-pass.life' : 'http://localhost:8080';
const API_CANCEL_RESERVATION = (id: number) => `${API_HOST}/api/reservations/${id}`;

interface TicketDetail {
  id: number;
  qrToken: string;
  guestName: string;
  guestPhoneNumber: string;
  ticketCount: number;
  status: 'CONFIRMED' | 'CANCELLED';
  isCheckedIn: boolean;
  createdAt: string;
  schedule: {
    id: number;
    startTime: string;
    endTime: string;
  };
  eventTitle?: string;
  eventLocation?: string;
}

// 캡쳐 방지 띠지 컴포넌트
const SecurityBanner: React.FC<{ text: string }> = ({ text }) => {
  const repeatedText = Array(10).fill(text).join('   •   ');

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {/* 대각선 띠지 1 */}
      <div
        className="absolute whitespace-nowrap text-blue-500/20 text-xs font-bold tracking-wider"
        style={{
          top: '30%',
          left: '-100%',
          width: '300%',
          transform: 'rotate(-15deg)',
          animation: 'scroll-left 8s linear infinite',
        }}
      >
        {repeatedText}
      </div>

      {/* 대각선 띠지 2 */}
      <div
        className="absolute whitespace-nowrap text-blue-500/15 text-xs font-bold tracking-wider"
        style={{
          top: '60%',
          left: '-100%',
          width: '300%',
          transform: 'rotate(-15deg)',
          animation: 'scroll-right 10s linear infinite',
        }}
      >
        {repeatedText}
      </div>

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes scroll-left {
          0% { transform: rotate(-15deg) translateX(0); }
          100% { transform: rotate(-15deg) translateX(-33.33%); }
        }
        @keyframes scroll-right {
          0% { transform: rotate(-15deg) translateX(-33.33%); }
          100% { transform: rotate(-15deg) translateX(0); }
        }
      `}</style>
    </div>
  );
};

const GuestTicketPage: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!qrToken) return;
      try {
        const response = await axios.get<TicketDetail>(`${API_HOST}/api/reservations/qr/${qrToken}`);
        setTicket(response.data);
      } catch {
        await showError('티켓 오류', '유효하지 않은 티켓입니다.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [qrToken, navigate]);

  const handleCancel = async () => {
    if (!ticket) return;

    const result = await showConfirm(
      '예약 취소',
      '취소하면 복구할 수 없습니다. 계속하시겠습니까?',
      '취소하기',
      '돌아가기'
    );

    if (!result.isConfirmed) return;

    try {
      await axios.delete(API_CANCEL_RESERVATION(ticket.id));
      await showSuccess('취소 완료', '예약이 취소되었습니다.');
      window.location.reload();
    } catch {
      await showError('취소 실패', '이미 입장했거나 취소할 수 없습니다.');
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatSchedule = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  if (!ticket) return null;

  const isCancelled = ticket.status === 'CANCELLED';
  const isUsed = ticket.isCheckedIn;

  // 띠지에 표시할 텍스트 (현재 시간 + 이름)
  const securityText = `${formatTime(currentTime)} • ${ticket.guestName} • FORM PASS`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 font-[Pretendard] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 티켓 카드 */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-blue-100/50 relative">
          {/* 캡쳐 방지 띠지 - 유효한 티켓에만 표시 */}
          {!isCancelled && !isUsed && (
            <SecurityBanner text={securityText} />
          )}

          {/* 헤더 */}
          <div className={`px-6 py-6 relative z-20 ${
            isCancelled
              ? 'bg-gray-100'
              : isUsed
              ? 'bg-gradient-to-r from-gray-700 to-gray-800'
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${
                  isCancelled
                    ? 'bg-gray-200 text-gray-600'
                    : isUsed
                    ? 'bg-white/20 text-white'
                    : 'bg-white/20 text-white'
                }`}>
                  {isCancelled ? (
                    <><XCircle size={12} /> 취소된 티켓</>
                  ) : isUsed ? (
                    <><CheckCircle size={12} /> 입장 완료</>
                  ) : (
                    '입장 대기'
                  )}
                </div>
                <h1 className={`text-xl font-bold leading-tight ${
                  isCancelled ? 'text-gray-600' : 'text-white'
                }`}>
                  {ticket.eventTitle || '이벤트'}
                </h1>
              </div>
              {!isCancelled && !isUsed && (
                <div className="text-right">
                  <p className="text-[10px] text-blue-100 mb-0.5">현재 시간</p>
                  <p className="text-sm font-mono text-white font-semibold">{formatTime(currentTime)}</p>
                </div>
              )}
            </div>
          </div>

          {/* QR 코드 */}
          <div className="px-6 py-10 flex flex-col items-center border-b border-dashed border-gray-200 relative bg-gradient-to-b from-white to-gray-50/50">
            {/* 노치 장식 */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-blue-50 to-white rounded-full z-20" />
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-blue-50 to-white rounded-full z-20" />

            <div className={`p-5 bg-white rounded-2xl shadow-lg relative z-20 ${
              isCancelled || isUsed ? 'opacity-40' : 'shadow-blue-100/50'
            }`}>
              <QRCodeSVG
                value={ticket.qrToken}
                size={180}
                level="H"
                includeMargin
                fgColor={isCancelled || isUsed ? '#9CA3AF' : '#1e40af'}
              />
            </div>

            {/* 상태 오버레이 */}
            {(isUsed || isCancelled) && (
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <div className={`px-6 py-3 rounded-xl font-bold text-lg -rotate-12 shadow-lg ${
                  isCancelled
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-800 text-white'
                }`}>
                  {isCancelled ? '취소됨' : '입장 완료'}
                </div>
              </div>
            )}

            {!isCancelled && !isUsed && (
              <p className="text-sm text-gray-400 mt-6 relative z-20">입장 시 이 QR코드를 제시해주세요</p>
            )}
          </div>

          {/* 정보 */}
          <div className="px-6 py-6 space-y-4 relative z-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <User size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">예약자</p>
                <p className="font-semibold text-gray-900">{ticket.guestName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">일시</p>
                <p className="font-semibold text-gray-900">{formatSchedule(ticket.schedule.startTime)}</p>
              </div>
            </div>

            {ticket.eventLocation && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <MapPin size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">장소</p>
                  <p className="font-semibold text-gray-900">{ticket.eventLocation}</p>
                </div>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="px-6 pb-6 space-y-3 relative z-20">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 bg-gray-100 rounded-xl text-gray-700 font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Home size={18} />
              홈으로
            </button>

            {!isUsed && !isCancelled && (
              <button
                onClick={handleCancel}
                className="w-full py-3.5 text-red-500 text-sm font-semibold hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <X size={16} />
                예약 취소
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestTicketPage;
