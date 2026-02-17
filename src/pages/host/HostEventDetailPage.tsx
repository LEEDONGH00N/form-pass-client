// src/pages/host/HostEventDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import Swal from 'sweetalert2';
import { authAxios, getAccessToken } from '../../api/authApi';
import {
    ArrowLeft,
    QrCode,
    CalendarX,
    CheckCircle2,
    UserCheck,
    X,
    Loader2,
    Search,
    Users
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

        // 토큰이 없으면 로그인 페이지로 리다이렉트
        if (!getAccessToken()) {
            navigate('/login');
            return;
        }

        try {
            const response = await authAxios.get<ScheduleStatusResponse[]>(API_SCHEDULE_STATUS_URL(eventId));

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
        const result = await Swal.fire({
            icon: 'question',
            title: '입장 확인',
            text: `${guestName}님을 입장 처리하시겠습니까?`,
            showCancelButton: true,
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280',
            confirmButtonText: '입장 처리',
            cancelButtonText: '취소'
        });

        if (!result.isConfirmed) return;

        try {
            await authAxios.patch(API_MANUAL_CHECKIN_URL(reservationId), {});
            await Swal.fire({
                icon: 'success',
                title: '입장 처리 완료',
                text: `${guestName}님 입장 처리가 완료되었습니다.`,
                confirmButtonColor: '#3B82F6',
                confirmButtonText: '확인',
                timer: 2000,
                showConfirmButton: false
            });
            fetchData();
        } catch (error) {
            console.error(error);
            await Swal.fire({
                icon: 'error',
                title: '입장 처리 실패',
                text: '입장 처리에 실패했습니다.',
                confirmButtonColor: '#3B82F6',
                confirmButtonText: '확인'
            });
        }
    };

    // --- QR 스캔 핸들러 ---
    const handleQrScan = async (text: string) => {
        if (!text || lastScanned === text || scanStatus === 'processing') return;

        setLastScanned(text);
        setScanStatus('processing');

        try {
            const response = await authAxios.post(API_QR_VERIFY_URL,
                { qrToken: text }
            );

            const { guestName, message } = response.data;

            setScanStatus('success');
            await Swal.fire({
                icon: 'success',
                title: '인증 성공',
                html: `<strong>이름:</strong> ${guestName}<br><strong>메시지:</strong> ${message || '입장 처리되었습니다.'}`,
                confirmButtonColor: '#3B82F6',
                confirmButtonText: '확인',
                timer: 2500,
                showConfirmButton: false
            });

            fetchData();

        } catch (error: any) {
            setScanStatus('error');
            console.error(error);
            const errMsg = error.response?.data?.message || '유효하지 않은 QR입니다.';

            if (error.response?.status === 409) {
                await Swal.fire({
                    icon: 'warning',
                    title: '중복 입장',
                    text: '이미 입장 처리된 티켓입니다.',
                    confirmButtonColor: '#3B82F6',
                    confirmButtonText: '확인'
                });
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: '인증 실패',
                    text: errMsg,
                    confirmButtonColor: '#3B82F6',
                    confirmButtonText: '확인'
                });
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
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
                <div className="text-blue-600 font-bold text-xl flex items-center gap-3">
                    <Loader2 className="animate-spin" /> 데이터 불러오는 중...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-50 via-white to-gray-50 min-h-screen font-[Pretendard]">

            {/* 상단 헤더 - Glassmorphism */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-white/50 h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/host/dashboard')} className="text-gray-500 hover:text-gray-800 p-2 rounded-xl hover:bg-gray-100 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-gray-800">예약자 관리</h1>
                        <span className="text-xs text-gray-500">현재 총 예약 <span className="text-blue-600 font-bold">{totalGuests}</span>명</span>
                    </div>
                </div>

                <button
                    onClick={() => { setIsQrOpen(true); setScanStatus('idle'); setLastScanned(null); }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 active:scale-[0.98]"
                >
                    <QrCode size={18} />
                    <span>QR 스캔</span>
                </button>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="max-w-4xl mx-auto p-6 space-y-6 pb-20">

                {/* 검색창 */}
                <div className="relative group">
                    <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="이름 또는 전화번호 뒷자리 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
                    />
                </div>

                {filteredSchedules.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20 bg-white/80 backdrop-blur-sm rounded-3xl p-16 border border-dashed border-gray-200">
                        <CalendarX size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">등록된 스케줄이 없습니다.</p>
                    </div>
                ) : (
                    filteredSchedules.map((schedule, idx) => (
                        <div key={schedule.scheduleId} className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100/80 overflow-hidden hover:shadow-xl hover:shadow-blue-100/30 transition-all">
                            {/* 스케줄 헤더 */}
                            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm shadow-md shadow-blue-200/50">
                                        {idx + 1}회차
                                    </span>
                                    <h3 className="font-bold text-lg text-gray-800">
                                        {schedule.startTime} ~ {schedule.endTime}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                    <Users size={16} className="text-blue-500" />
                                    예약 <span className="text-blue-600 font-bold">{schedule.reservations?.length || 0}</span> / {schedule.maxCapacity}
                                </div>
                            </div>

                            {/* 예약자 명단 */}
                            <div className="divide-y divide-gray-50">
                                {(!schedule.reservations || schedule.reservations.length === 0) ? (
                                    <div className="p-12 text-center text-gray-400 text-sm">
                                        {searchTerm ? '검색 결과가 없습니다.' : '아직 예약자가 없습니다.'}
                                    </div>
                                ) : (
                                    schedule.reservations.map((res) => (
                                        <div key={res.id} className="px-6 py-4 flex items-center justify-between hover:bg-blue-50/30 transition-all group border-l-2 border-transparent hover:border-blue-500">
                                            <div>
                                                <div className="font-bold text-gray-800 flex items-center gap-2 mb-1">
                                                    {res.guestName}
                                                    {res.isCheckedIn ? (
                                                        <span className="text-[10px] bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-2 py-0.5 rounded-lg border border-green-200 font-bold">
                                                            입장완료
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg border border-gray-200">
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
                                                        className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-200/50 transition-all"
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
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-200 p-4">
                    <button
                        onClick={() => setIsQrOpen(false)}
                        className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-xl transition"
                    >
                        <X size={32} />
                    </button>

                    <div className="w-full max-w-sm relative flex flex-col items-center">
                        <div className="text-white text-center mb-8 font-bold text-xl">
                            QR 코드를 스캔하세요
                        </div>

                        <div className="w-full aspect-square rounded-3xl overflow-hidden border-4 border-blue-500 shadow-glow-lg relative bg-black">
                            <Scanner
                                onScan={(result) => {
                                    if (result && result.length > 0) {
                                        handleQrScan(result[0].rawValue);
                                    }
                                }}
                                onError={(error: any) => {
                                    console.log(error);
                                    const msg = error?.message || '권한을 확인해주세요 (HTTPS 필수)';
                                    Swal.fire({
                                        icon: 'error',
                                        title: '카메라 오류',
                                        text: msg,
                                        confirmButtonColor: '#3B82F6',
                                        confirmButtonText: '확인'
                                    });
                                }}
                                components={{ finder: false }}
                                styles={{
                                    container: { width: '100%', height: '100%' },
                                    video: { objectFit: 'cover' }
                                }}
                            />

                            {/* 스캔 가이드 라인 */}
                            <div className="absolute inset-0 border-2 border-white/20 m-8 rounded-2xl pointer-events-none">
                                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
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
                            className="w-full bg-white text-gray-900 font-bold py-4 rounded-2xl hover:bg-gray-100 transition active:scale-[0.98] shadow-xl"
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
