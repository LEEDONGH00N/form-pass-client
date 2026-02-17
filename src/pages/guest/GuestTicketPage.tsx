// src/pages/guest/GuestTicketPage.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import {
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Home,
  Trash2,
  AlertCircle
} from 'lucide-react';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_HOST = IS_PRODUCTION ? 'https://api.form-pass.life' : 'http://localhost:8080';

// API: 예약 취소 (DELETE /api/reservations/{id})
const API_CANCEL_RESERVATION = (id: number) => `${API_HOST}/api/reservations/${id}`;

// API 명세서 기반 인터페이스
interface TicketDetail {
    id: number;
    qrToken: string;
    guestName: string;
    guestPhoneNumber: string;
    ticketCount: number;
    status: 'CONFIRMED' | 'CANCELLED'; // 상태값 반영
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

const GuestTicketPage: React.FC = () => {
    const { qrToken } = useParams<{ qrToken: string }>();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // 실시간 시계
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 티켓 조회
    useEffect(() => {
        const fetchTicket = async () => {
            if (!qrToken) return;
            try {
                const response = await axios.get<TicketDetail>(`${API_HOST}/api/reservations/qr/${qrToken}`);
                setTicket(response.data);
            } catch (err) {
                console.error("티켓 조회 실패:", err);
                await Swal.fire({
                    icon: 'error',
                    title: '티켓 조회 실패',
                    text: '유효하지 않은 티켓이거나 만료되었습니다.',
                    confirmButtonColor: '#3B82F6',
                    confirmButtonText: '확인'
                });
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [qrToken, navigate]);

    // 예약 취소 핸들러
    const handleCancel = async () => {
        if (!ticket) return;

        const result = await Swal.fire({
            icon: 'warning',
            title: '예약 취소',
            text: '정말로 예약을 취소하시겠습니까? 취소 후에는 복구할 수 없습니다.',
            showCancelButton: true,
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280',
            confirmButtonText: '취소하기',
            cancelButtonText: '돌아가기'
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(API_CANCEL_RESERVATION(ticket.id));
            await Swal.fire({
                icon: 'success',
                title: '취소 완료',
                text: '예약이 정상적으로 취소되었습니다.',
                confirmButtonColor: '#3B82F6',
                confirmButtonText: '확인'
            });
            window.location.reload(); // 상태 업데이트를 위해 새로고침
        } catch (error) {
            console.error(error);
            await Swal.fire({
                icon: 'error',
                title: '취소 실패',
                text: '예약 취소에 실패했습니다. 이미 입장했거나 기간이 지났을 수 있습니다.',
                confirmButtonColor: '#3B82F6',
                confirmButtonText: '확인'
            });
        }
    };

    const formatTime = (date: Date) => date.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const formatScheduleDate = (iso: string) => {
        const d = new Date(iso);
        return `${d.getMonth()+1}월 ${d.getDate()}일 ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100"><Loader2 className="animate-spin text-blue-600 w-10 h-10"/></div>;
    if (!ticket) return null;

    const isCancelled = ticket.status === 'CANCELLED';
    const isUsed = ticket.isCheckedIn;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-slate-200 font-[Pretendard] flex justify-center items-start pt-6 px-4 pb-20">
            <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden relative border border-gray-200/50 ring-1 ring-black/5">

                {/* 보안 띠지 (취소된 경우 회색 처리) */}
                <div className={`${isCancelled ? 'bg-gray-500' : 'bg-gradient-to-r from-blue-600 to-blue-700'} h-12 relative overflow-hidden flex items-center transition-colors duration-500`}>
                    {!isCancelled && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 w-[200%] animate-gradient-x"></div>
                    )}
                    <div className="absolute whitespace-nowrap animate-marquee text-white/90 text-sm font-bold flex gap-8 items-center">
                        <span>Form PASS Valid Ticket</span>
                        <span className="flex items-center gap-1"><ShieldCheck size={14}/> 캡처 절대 불가</span>
                        <span>Form PASS Valid Ticket</span>
                    </div>
                </div>

                {/* 헤더 */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 text-center relative">
                    <div className="absolute top-4 right-4 text-right">
                        <span className="text-[10px] text-slate-400 block">Current Time</span>
                        <span className={`text-sm font-bold font-mono ${isCancelled ? 'text-red-400' : 'text-green-400'} animate-pulse`}>
                            {formatTime(currentTime)}
                        </span>
                    </div>

                    <h2 className="text-xl font-bold mt-4 leading-tight mb-2">
                        {ticket.eventTitle || "이벤트 티켓"}
                    </h2>

                    <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${isCancelled ? 'bg-red-900/50 text-red-200' : 'bg-slate-700 text-slate-300'}`}>
                        {isCancelled ? (
                            <>
                                <AlertCircle size={12} /> <span>예약 취소됨</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={12} className="text-green-400" /> <span>예약 확정됨</span>
                            </>
                        )}
                    </div>
                </div>

                {/* QR 코드 영역 */}
                <div className="p-8 flex flex-col items-center bg-gradient-to-b from-white to-gray-50/50 relative">
                    <div className="absolute -top-3 left-0 w-6 h-6 bg-gradient-to-br from-gray-100 to-slate-200 rounded-full"></div>
                    <div className="absolute -top-3 right-0 w-6 h-6 bg-gradient-to-br from-gray-100 to-slate-200 rounded-full"></div>

                    <div className={`p-5 rounded-2xl bg-white transition-all
                        ${(isUsed || isCancelled) ? 'border-2 border-gray-200 grayscale opacity-40' : 'border-2 border-blue-100 shadow-xl shadow-blue-100/50'}
                    `}>
                        <QRCodeSVG value={ticket.qrToken} size={180} level={"H"} includeMargin={true} fgColor={(isUsed || isCancelled) ? "#9CA3AF" : "#000000"} />

                        {/* 상태 오버레이 (사용 완료) */}
                        {isUsed && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <span className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-lg rotate-[-10deg] shadow-xl border-2 border-white">
                                    입장 완료
                                </span>
                            </div>
                        )}

                        {/* 상태 오버레이 (취소됨) */}
                        {isCancelled && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <span className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-lg rotate-[-10deg] shadow-xl border-2 border-white">
                                    취소된 티켓
                                </span>
                            </div>
                        )}
                    </div>

                    {!isCancelled && !isUsed && (
                        <div className="mt-6 flex items-center gap-2 text-xs text-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-2.5 rounded-xl border border-blue-100">
                            <RefreshCcw size={12} className="animate-spin-slow" />
                            <span className="font-medium">실시간 유효성 검증 중</span>
                        </div>
                    )}
                </div>

                {/* 상세 정보 구분선 */}
                <div className="relative w-full h-4 bg-gradient-to-r from-gray-50 to-slate-50 flex items-center">
                    <div className="absolute left-0 w-4 h-8 bg-gradient-to-br from-gray-100 to-slate-200 rounded-r-full -ml-2"></div>
                    <div className="w-full border-b-2 border-dashed border-gray-300 mx-4"></div>
                    <div className="absolute right-0 w-4 h-8 bg-gradient-to-br from-gray-100 to-slate-200 rounded-l-full -mr-2"></div>
                </div>

                {/* 상세 정보 */}
                <div className="bg-gradient-to-b from-gray-50 to-white p-6 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100 hover:bg-blue-50/30 -mx-2 px-2 rounded-lg transition-colors">
                        <span className="text-gray-500 text-sm font-medium">예약자</span>
                        <div className="flex items-center gap-2 font-bold text-gray-800"><User size={16} className="text-blue-500" />{ticket.guestName}</div>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100 hover:bg-blue-50/30 -mx-2 px-2 rounded-lg transition-colors">
                        <span className="text-gray-500 text-sm font-medium">입장 시간</span>
                        <div className="text-sm font-bold text-gray-800 flex items-center gap-1"><Calendar size={14} className="text-blue-500" />{formatScheduleDate(ticket.schedule.startTime)}</div>
                    </div>
                    <div className="flex justify-between items-center hover:bg-blue-50/30 -mx-2 px-2 rounded-lg transition-colors">
                        <span className="text-gray-500 text-sm font-medium">장소</span>
                        <div className="text-sm font-bold text-gray-800 flex items-center gap-1"><MapPin size={14} className="text-blue-500" />{ticket.eventLocation || "-"}</div>
                    </div>
                </div>

                {/* 하단 버튼 영역 */}
                <div className="p-4 bg-gray-50 space-y-3">
                    <button onClick={() => navigate('/')} className="w-full py-3.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 shadow-sm">
                        <Home size={18} /> 메인으로
                    </button>

                    {/* 예약 취소 버튼 (입장 전 & 취소 안 된 경우만) */}
                    {!isUsed && !isCancelled && (
                        <button
                            onClick={handleCancel}
                            className="w-full py-3 text-red-500 text-sm font-bold hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-100"
                        >
                            <Trash2 size={16} /> 예약 취소하기
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestTicketPage;
