import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { showSuccess, showError, showWarning, showConfirm, showCustomModal } from '../../constants/swalTheme';
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
    Users,
    Zap
} from 'lucide-react';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_HOST = IS_PRODUCTION ? 'https://api.form-pass.life' : 'http://localhost:8080';

const API_SCHEDULE_STATUS_URL = (eventId: string) => `${API_HOST}/api/host/events/${eventId}/schedules-status`;
const API_QR_VERIFY_URL = `${API_HOST}/api/host/checkin`;
const API_MANUAL_CHECKIN_URL = (reservationId: number) => `${API_HOST}/api/host/reservations/${reservationId}/checkin`;

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
    const [searchTerm, setSearchTerm] = useState('');

    const [isQrOpen, setIsQrOpen] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [scanStatus, setScanStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

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

    const handleManualCheckIn = async (reservationId: number, guestName: string) => {
        const result = await showConfirm('입장 확인', `${guestName}님을 입장 처리하시겠습니까?`, '입장 처리', '취소');

        if (!result.isConfirmed) return;

        try {
            await authAxios.patch(API_MANUAL_CHECKIN_URL(reservationId), {});
            await showSuccess('입장 처리 완료', `${guestName}님 입장 처리가 완료되었습니다.`);
            fetchData();
        } catch (error) {
            console.error(error);
            await showError('입장 처리 실패', '입장 처리에 실패했습니다.');
        }
    };

    const handleQrScan = async (text: string) => {
        if (!text || lastScanned === text || scanStatus === 'processing') return;

        setLastScanned(text);
        setScanStatus('processing');

        try {
            const response = await authAxios.post(API_QR_VERIFY_URL, { qrToken: text });
            const { guestName, message } = response.data;

            setScanStatus('success');
            await showCustomModal({
                icon: 'success',
                title: '입장 확인',
                html: `
                    <div class="text-center py-2">
                        <p class="text-2xl font-bold text-gray-900 mb-2">${guestName}</p>
                        <p class="text-gray-500">${message || '입장 처리되었습니다.'}</p>
                    </div>
                `,
                timer: 2000,
                showConfirmButton: false
            });

            fetchData();

        } catch (error: any) {
            setScanStatus('error');
            console.error(error);
            const errMsg = error.response?.data?.message || '유효하지 않은 QR입니다.';

            if (error.response?.status === 409) {
                await showWarning('중복 입장', '이미 입장 처리된 티켓입니다.');
            } else {
                await showError('인증 실패', errMsg);
            }
        } finally {
            setTimeout(() => {
                setScanStatus('idle');
                setLastScanned(null);
            }, 3000);
        }
    };

    const filteredSchedules = schedules.map(sch => ({
        ...sch,
        reservations: sch.reservations?.filter(res =>
            res.guestName.includes(searchTerm) || res.guestPhoneNumber.includes(searchTerm)
        ) || []
    }));

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
                <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 font-[Pretendard]">
            {/* 헤더 */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/host/dashboard')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-all">
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">예약자 관리</h1>
                        <p className="text-sm text-gray-500">총 <span className="text-blue-600 font-semibold">{totalGuests}</span>명 예약</p>
                    </div>
                </div>

                <button
                    onClick={() => { setIsQrOpen(true); setScanStatus('idle'); setLastScanned(null); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
                >
                    <QrCode size={18} />
                    QR 스캔
                </button>
            </header>

            {/* 메인 */}
            <main className="max-w-4xl mx-auto p-6 space-y-6 pb-20">
                {/* 검색 */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="이름 또는 전화번호 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    />
                </div>

                {filteredSchedules.length === 0 ? (
                    <div className="text-center text-gray-400 mt-16 bg-white rounded-3xl p-16 border-2 border-dashed border-gray-200">
                        <CalendarX size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">등록된 스케줄이 없습니다</p>
                    </div>
                ) : (
                    filteredSchedules.map((schedule, idx) => (
                        <div key={schedule.scheduleId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* 스케줄 헤더 */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center gap-3">
                                    <span className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm shadow-sm">
                                        {idx + 1}회차
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {schedule.startTime} ~ {schedule.endTime}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium">
                                    <Users size={16} />
                                    {schedule.reservations?.length || 0} / {schedule.maxCapacity}
                                </div>
                            </div>

                            {/* 예약자 목록 */}
                            <div className="divide-y divide-gray-50">
                                {(!schedule.reservations || schedule.reservations.length === 0) ? (
                                    <div className="p-12 text-center text-gray-400 text-sm">
                                        {searchTerm ? '검색 결과가 없습니다' : '아직 예약자가 없습니다'}
                                    </div>
                                ) : (
                                    schedule.reservations.map((res) => (
                                        <div key={res.id} className="px-6 py-4 flex items-center justify-between hover:bg-blue-50/30 transition-colors">
                                            <div>
                                                <div className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                                                    {res.guestName}
                                                    {res.isCheckedIn ? (
                                                        <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">
                                                            입장완료
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                                            대기중
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    {res.guestPhoneNumber} · {formatDate(res.createdAt)}
                                                </div>
                                            </div>

                                            <div>
                                                {res.isCheckedIn ? (
                                                    <CheckCircle2 size={24} className="text-green-500" />
                                                ) : (
                                                    <button
                                                        onClick={() => handleManualCheckIn(res.id, res.guestName)}
                                                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm"
                                                    >
                                                        <UserCheck size={16} /> 입장
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
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
                    <button
                        onClick={() => setIsQrOpen(false)}
                        className="absolute top-6 right-6 text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X size={28} />
                    </button>

                    <div className="w-full max-w-sm flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-white font-bold text-lg">QR 스캔</span>
                        </div>

                        <div className="w-full aspect-square rounded-3xl overflow-hidden border-4 border-blue-500/50 relative bg-black shadow-2xl">
                            <Scanner
                                onScan={(result) => {
                                    if (result && result.length > 0) {
                                        handleQrScan(result[0].rawValue);
                                    }
                                }}
                                onError={(error: any) => {
                                    console.log(error);
                                    const msg = error?.message || '권한을 확인해주세요 (HTTPS 필수)';
                                    showError('카메라 오류', msg);
                                }}
                                components={{ finder: false }}
                                styles={{
                                    container: { width: '100%', height: '100%' },
                                    video: { objectFit: 'cover' }
                                }}
                            />

                            {/* 스캔 가이드 */}
                            <div className="absolute inset-8 border-2 border-white/40 rounded-2xl pointer-events-none">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-blue-400 rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-blue-400 rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-blue-400 rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-blue-400 rounded-br-lg" />
                            </div>

                            {scanStatus === 'processing' && (
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                    <Loader2 className="animate-spin text-blue-400 w-12 h-12 mb-3" />
                                    <span className="text-white font-medium">확인 중...</span>
                                </div>
                            )}
                        </div>

                        <p className="text-gray-400 text-center mt-8 text-sm">
                            QR 코드를 화면 중앙에 맞춰주세요
                        </p>

                        <button
                            onClick={() => setIsQrOpen(false)}
                            className="w-full mt-8 bg-white text-gray-900 font-semibold py-4 rounded-2xl hover:bg-gray-100 transition-colors"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostEventDetailPage;
