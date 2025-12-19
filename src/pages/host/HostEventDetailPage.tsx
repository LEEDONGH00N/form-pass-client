// src/pages/host/HostEventDetailPage.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
    ArrowLeft, 
    QrCode, 
    CalendarX, 
    CheckCircle2, 
    UserCheck, 
    X, 
    Loader2, 
    Search 
} from 'lucide-react';

// =================================================================
// 1. 설정 및 API 주소
// =================================================================
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_HOST = IS_PRODUCTION ? 'https://api.form-pass.life' : 'http://localhost:8080';

const API_SCHEDULE_STATUS_URL = (eventId: string) => `${API_HOST}/api/host/events/${eventId}/schedules-status`;
const API_QR_VERIFY_URL = `${API_HOST}/api/host/checkin`;
const API_MANUAL_CHECKIN_URL = (reservationId: number) => `${API_HOST}/api/host/reservations/${reservationId}/checkin`;

// =================================================================
// 2. 타입 정의
// =================================================================

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

// =================================================================
// 3. 컴포넌트
// =================================================================
const HostEventDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();
    
    // --- State ---
    const [schedules, setSchedules] = useState<ScheduleStatusResponse[]>([]);
    const [totalGuests, setTotalGuests] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); 

    // QR 모달 상태
    const [isQrOpen, setIsQrOpen] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [scanStatus, setScanStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    // --- 날짜 포맷터 ---
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

    // --- 데이터 불러오기 ---
    const fetchData = async () => {
        if (!eventId) return;
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get<ScheduleStatusResponse[]>(API_SCHEDULE_STATUS_URL(eventId), {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;
            setSchedules(data);

            const total = data.reduce((acc, curr) => acc + (curr.reservations?.length || 0), 0);
            setTotalGuests(total);

        } catch (error) {
            console.error('스케줄 현황 로드 실패', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    // --- 수동 체크인 핸들러 ---
    const handleManualCheckIn = async (reservationId: number, guestName: string) => {
        if (!window.confirm(`${guestName}님을 입장 처리하시겠습니까?`)) return;

        try {
            const token = localStorage.getItem('accessToken');
            await axios.patch(API_MANUAL_CHECKIN_URL(reservationId), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`✅ ${guestName}님 입장 처리 완료`);
            fetchData(); 
        } catch (error) {
            console.error(error);
            alert('❌ 입장 처리 실패');
        }
    };

    // --- QR 스캔 핸들러 ---
    const handleQrScan = async (text: string) => {
        if (!text || lastScanned === text || scanStatus === 'processing') return; 
        
        setLastScanned(text);
        setScanStatus('processing');

        try {
            const token = localStorage.getItem('accessToken');
            
            const response = await axios.post(API_QR_VERIFY_URL, 
                { qrToken: text }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { guestName, message } = response.data;

            setScanStatus('success');
            alert(`✅ 인증 성공!\n\n이름: ${guestName}\n메시지: ${message || '입장 처리되었습니다.'}`);
            
            fetchData(); 

        } catch (error: any) {
            setScanStatus('error');
            console.error(error);
            const errMsg = error.response?.data?.message || '유효하지 않은 QR입니다.';
            
            if (error.response?.status === 409) {
                alert(`⚠️ 이미 입장 처리된 티켓입니다.`);
            } else {
                alert(`❌ 인증 실패: ${errMsg}`);
            }
        } finally {
            setTimeout(() => {
                setScanStatus('idle');
                setLastScanned(null);
            }, 3000);
        }
    };

    // 검색 필터링 로직
    const filteredSchedules = schedules.map(sch => ({
        ...sch,
        reservations: sch.reservations?.filter(res => 
            res.guestName.includes(searchTerm) || res.guestPhoneNumber.includes(searchTerm)
        ) || []
    }));

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-indigo-600 font-bold text-xl flex items-center gap-2">
                    <Loader2 className="animate-spin" /> 데이터 불러오는 중...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen font-[Pretendard]">
            
            {/* 상단 헤더 */}
            <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/host/dashboard')} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-gray-800">예약자 관리</h1>
                        <span className="text-xs text-gray-500">현재 총 예약 <span className="text-indigo-600 font-bold">{totalGuests}</span>명</span>
                    </div>
                </div>

                <button 
                    onClick={() => { setIsQrOpen(true); setScanStatus('idle'); setLastScanned(null); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-md active:scale-95"
                >
                    <QrCode size={18} />
                    <span>QR 스캔</span>
                </button>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="max-w-4xl mx-auto p-6 space-y-6 pb-20">
                
                {/* 검색창 */}
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
                    <div className="text-center text-gray-400 mt-20">
                        <CalendarX size={48} className="mx-auto mb-4 opacity-50" />
                        <p>등록된 스케줄이 없습니다.</p>
                    </div>
                ) : (
                    filteredSchedules.map((schedule, idx) => (
                        <div key={schedule.scheduleId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* 스케줄 헤더 */}
                            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded text-sm">
                                        {idx + 1}회차
                                    </span>
                                    <h3 className="font-bold text-lg text-gray-800">
                                        {schedule.startTime} ~ {schedule.endTime}
                                    </h3>
                                </div>
                                <div className="text-sm font-medium text-gray-500">
                                    예약 <span className="text-indigo-600 font-bold">{schedule.reservations?.length || 0}</span> / {schedule.maxCapacity}
                                </div>
                            </div>

                            {/* 예약자 명단 */}
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
                                                    {res.isCheckedIn ? (
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold">
                                                            입장완료
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                            미입장
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-400 flex items-center gap-2">
                                                    <span>{res.guestPhoneNumber}</span>
                                                    <span className="text-gray-300 text-[10px]">|</span>
                                                    <span>{formatDate(res.createdAt)}</span>
                                                </div>
                                            </div>
                                            
                                            {/* 우측 아이콘 */}
                                            <div>
                                                {res.isCheckedIn ? (
                                                    <CheckCircle2 size={24} className="text-green-500" />
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

            {/* QR 스캐너 모달 */}
            {isQrOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col items-center justify-center animate-in fade-in duration-200 p-4">
                    <button 
                        onClick={() => setIsQrOpen(false)}
                        className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition"
                    >
                        <X size={32} />
                    </button>

                    <div className="w-full max-w-sm relative flex flex-col items-center">
                        <div className="text-white text-center mb-8 font-bold text-xl">
                            QR 코드를 스캔하세요
                        </div>
                        
                        <div className="w-full aspect-square rounded-3xl overflow-hidden border-4 border-indigo-500 shadow-[0_0_50px_rgba(79,70,229,0.4)] relative bg-black">
                            <Scanner 
                                onScan={(result) => {
                                    if (result && result.length > 0) {
                                        handleQrScan(result[0].rawValue);
                                    }
                                }}
                                // 🔥 [수정됨] 여기서 error 타입을 any로 지정하여 TypeScript 오류 해결
                                onError={(error: any) => {
                                    console.log(error);
                                    // error 객체에 message가 없을 수도 있으므로 안전하게 접근
                                    const msg = error?.message || '권한을 확인해주세요 (HTTPS 필수)';
                                    alert(`카메라 오류: ${msg}`);
                                }}
                                components={{ finder: false }}
                                styles={{
                                    container: { width: '100%', height: '100%' },
                                    video: { objectFit: 'cover' }
                                }}
                            />
                            
                            {/* 스캔 가이드 라인 */}
                            <div className="absolute inset-0 border-2 border-white/20 m-8 rounded-xl pointer-events-none">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
                            </div>

                            {scanStatus === 'processing' && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                                    <Loader2 className="animate-spin text-white w-10 h-10 mb-2" />
                                    <span className="text-white text-sm font-bold">확인 중...</span>
                                </div>
                            )}
                        </div>

                        <p className="text-gray-400 text-center mt-8 text-sm leading-relaxed mb-8">
                            입장객의 티켓 QR 코드를<br/>
                            화면 중앙에 맞춰주세요.
                        </p>

                        <button 
                            onClick={() => setIsQrOpen(false)}
                            className="w-full bg-white text-gray-900 font-bold py-4 rounded-xl hover:bg-gray-100 transition active:scale-95 shadow-lg"
                        >
                            스캔 종료
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostEventDetailPage;