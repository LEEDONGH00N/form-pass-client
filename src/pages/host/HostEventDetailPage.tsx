// src/pages/host/HostEventDetailPage.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ArrowLeft, QrCode, CalendarX, CheckCircle2, Circle, X, Loader2, Search, UserCheck } from 'lucide-react';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_HOST = IS_PRODUCTION ? 'https://api.form-pass.life' : 'http://localhost:8080';

const API_SCHEDULE_STATUS_URL = (eventId: string) => `${API_HOST}/api/host/events/${eventId}/schedules-status`;
const API_QR_VERIFY_URL = `${API_HOST}/api/host/checkin`;
// 🔥 [추가] 수동 체크인 API
const API_MANUAL_CHECKIN_URL = (reservationId: number) => `${API_HOST}/api/host/reservations/${reservationId}/checkin`;

// ... (타입 정의 동일) ...
interface SimpleReservationDto {
    id: number;
    guestName: string;
    guestPhoneNumber: string;
    ticketCount: number;
    isCheckedIn: boolean;
    createdAt?: string;
}

interface ScheduleStatusResponse {
    scheduleId: number;
    startTime: string;    
    endTime: string;      
    maxCapacity: number;
    currentCount: number;
    reservations: SimpleReservationDto[];
}

const HostEventDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();
    
    const [schedules, setSchedules] = useState<ScheduleStatusResponse[]>([]);
    const [totalGuests, setTotalGuests] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // 🔥 검색어 상태

    const [isQrOpen, setIsQrOpen] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [scanStatus, setScanStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    // ... (formatDate 함수 동일) ...
    const formatDate = (isoString?: string) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '-';
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${month}/${day} ${hour}:${minute}`;
    };

    const fetchData = async () => {
        if (!eventId) return;
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get<ScheduleStatusResponse[]>(API_SCHEDULE_STATUS_URL(eventId), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchedules(response.data);
            const total = response.data.reduce((acc, curr) => acc + (curr.reservations?.length || 0), 0);
            setTotalGuests(total);
        } catch (error) {
            console.error('로드 실패', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [eventId]);

    // 🔥 [추가] 수동 체크인 핸들러
    const handleManualCheckIn = async (reservationId: number, guestName: string) => {
        if (!window.confirm(`${guestName}님을 입장 처리하시겠습니까?`)) return;

        try {
            const token = localStorage.getItem('accessToken');
            await axios.patch(API_MANUAL_CHECKIN_URL(reservationId), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`${guestName}님 입장 처리 완료`);
            fetchData(); // 목록 새로고침
        } catch (error) {
            console.error(error);
            alert('입장 처리 실패');
        }
    };

    // QR 핸들러 생략 (기존과 동일)
    const handleQrScan = async (text: string) => { /* ... 기존 코드 ... */ };

    // 🔥 [추가] 검색 필터링 로직
    const filteredSchedules = schedules.map(sch => ({
        ...sch,
        reservations: sch.reservations?.filter(res => 
            res.guestName.includes(searchTerm) || res.guestPhoneNumber.includes(searchTerm)
        ) || []
    }));

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;

    return (
        <div className="bg-gray-50 min-h-screen font-[Pretendard]">
            <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/host/dashboard')} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition"><ArrowLeft size={20} /></button>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-gray-800">예약자 관리</h1>
                        <span className="text-xs text-gray-500">총 예약 {totalGuests}명</span>
                    </div>
                </div>
                <button onClick={() => { setIsQrOpen(true); setScanStatus('idle'); setLastScanned(null); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md">
                    <QrCode size={18} /><span>QR 스캔</span>
                </button>
            </header>

            <main className="max-w-4xl mx-auto p-6 space-y-6 pb-20">
                
                {/* 🔥 [추가] 검색창 */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="이름 또는 전화번호 뒷자리 검색" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                </div>

                {filteredSchedules.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20"><CalendarX size={48} className="mx-auto mb-4 opacity-50" /><p>등록된 스케줄이 없습니다.</p></div>
                ) : (
                    filteredSchedules.map((schedule, idx) => (
                        <div key={schedule.scheduleId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded text-sm">{idx + 1}회차</span>
                                    <h3 className="font-bold text-lg text-gray-800">{schedule.startTime} ~ {schedule.endTime}</h3>
                                </div>
                                <div className="text-sm font-medium text-gray-500">예약 <span className="text-indigo-600 font-bold">{schedule.reservations?.length || 0}</span> / {schedule.maxCapacity}</div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {(!schedule.reservations || schedule.reservations.length === 0) ? (
                                    <div className="p-10 text-center text-gray-400 text-sm">
                                        {searchTerm ? '검색 결과가 없습니다.' : '아직 예약자가 없습니다.'}
                                    </div>
                                ) : (
                                    schedule.reservations.map((res) => (
                                        <div key={res.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition group">
                                            <div>
                                                <div className="font-bold text-gray-800 flex items-center gap-2 mb-1">
                                                    {res.guestName}
                                                    {res.isCheckedIn ? 
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold">입장완료</span> : 
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">미입장</span>
                                                    }
                                                </div>
                                                <div className="text-sm text-gray-400 flex items-center gap-2">
                                                    <span>{res.guestPhoneNumber}</span>
                                                    <span className="text-gray-300 text-[10px]">|</span>
                                                    <span>{formatDate(res.createdAt)}</span>
                                                </div>
                                            </div>
                                            
                                            {/* 🔥 [추가] 수동 체크인 버튼 */}
                                            <div>
                                                {res.isCheckedIn ? (
                                                    <CheckCircle2 size={28} className="text-green-500" />
                                                ) : (
                                                    <button 
                                                        onClick={() => handleManualCheckIn(res.id, res.guestName)}
                                                        className="flex items-center gap-1 bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition"
                                                    >
                                                        <UserCheck size={14} /> 입장확인
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>
            {/* ... QR 모달 코드 유지 ... */}
        </div>
    );
};

export default HostEventDetailPage;