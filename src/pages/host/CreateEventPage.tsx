// src/pages/host/HostEventCreatePage.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
    X, 
    Upload, 
    Trash2, 
    ChevronLeft, 
    ChevronRight, 
    Loader2
} from 'lucide-react';

// =================================================================
// 1. 환경별 URL 및 상수 정의
// =================================================================
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SERVICE_DOMAIN = IS_PRODUCTION ? 'form-pass.life' : 'localhost:3000';
const API_HOST = IS_PRODUCTION ? 'https://api.form-pass.life' : 'http://localhost:8080';
const API_BASE_URL = `${API_HOST}/api/host/events`;
const PRESIGNED_URL_API = `${API_HOST}/api/host/s3/presigned-url`; 

// =================================================================
// 2. DTO 인터페이스 정의
// =================================================================

interface ScheduleRequest {
  startTime: string; 
  endTime: string;   
  maxCapacity: number; 
}

interface LocalScheduleState {
    timeStart: string; 
    timeEnd: string;   
    maxCapacity: number; 
}

interface QuestionRequest {
  questionText: string; 
  questionType: 'TEXT' | 'SELECT' | 'CHECKBOX'; 
  isRequired: boolean; 
}

interface CreateEventRequest {
  title: string;
  location: string;    
  images: string[]; // [변경] 다중 이미지 URL
  description: string;
  schedules: ScheduleRequest[];
  questions: QuestionRequest[];
}

interface EventResponse {
    id: number;
    title: string;
    location: string;
    images: string[]; // [변경]
    thumbnailUrl?: string; // 하위 호환용
    description: string;
    eventCode?: string;
    schedules: ScheduleRequest[];
    questions: QuestionRequest[];
}

interface PresignedUrlResponse {
    presignedUrl: string;
    fileUrl: string;
}

// =================================================================
// 3. 컴포넌트 로직
// =================================================================

const HostEventCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>(); 
    const isEditMode = Boolean(eventId); 

    // --- 상태 정의 ---
    const [mainEventDate, setMainEventDate] = useState(''); 

    const initialQuestions: QuestionRequest[] = [
        { questionType: 'TEXT', questionText: '이름', isRequired: true },
        { questionType: 'TEXT', questionText: '연락처', isRequired: true },
    ];
    
    const initialLocalSchedules: LocalScheduleState[] = [
        { timeStart: '14:00', timeEnd: '15:00', maxCapacity: 30 },
    ];

    const [eventData, setEventData] = useState({
        title: '',
        location: '',
        images: [] as string[], // [변경] 이미지 배열
        description: '',
        questions: initialQuestions,
    });
    
    const [localSchedules, setLocalSchedules] = useState<LocalScheduleState[]>(initialLocalSchedules);
    const [previewCode, setPreviewCode] = useState('AbC1d');
    
    const [isSaving, setIsSaving] = useState(false); 
    const [isUploading, setIsUploading] = useState(false);
    const [isFetching, setIsFetching] = useState(false); 

    // --- 유틸리티 ---
    const toIsoString = (dateString: string, timeString: string): string => {
        try {
            const [year, month, day] = dateString.split('-').map(Number);
            const [hour, minute] = timeString.split(':').map(Number);
            const date = new Date(year, month - 1, day, hour, minute);
            const offset = date.getTimezoneOffset() * 60000;
            return new Date(date.getTime() - offset).toISOString().slice(0, 19); 
        } catch (e) {
            return ""; 
        }
    };

    const parseIsoToLocal = (isoString: string) => {
        const dateObj = new Date(isoString);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hour = String(dateObj.getHours()).padStart(2, '0');
        const minute = String(dateObj.getMinutes()).padStart(2, '0');
        return {
            datePart: `${year}-${month}-${day}`,
            timePart: `${hour}:${minute}`
        };
    };

    // --- 초기 데이터 로딩 ---
    useEffect(() => {
        const fetchEventDetails = async () => {
            if (!isEditMode || !eventId) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                setMainEventDate(`${yyyy}-${mm}-${dd}`);
                return;
            }

            setIsFetching(true);
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    await Swal.fire({
                        icon: 'warning',
                        title: '로그인 필요',
                        text: '로그인이 필요합니다.',
                        confirmButtonColor: '#4F46E5',
                        confirmButtonText: '확인'
                    });
                    navigate('/login');
                    return;
                }

                const response = await axios.get<EventResponse>(`${API_BASE_URL}/${eventId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = response.data;

                // [변경] 이미지 매핑 로직 (하위 호환성 고려)
                const loadedImages = data.images && data.images.length > 0 
                    ? data.images 
                    : (data.thumbnailUrl ? [data.thumbnailUrl] : []);

                setEventData({
                    title: data.title,
                    location: data.location || '',
                    images: loadedImages,
                    description: data.description || '',
                    questions: data.questions || initialQuestions,
                });

                if (data.eventCode) {
                    setPreviewCode(data.eventCode);
                }

                if (data.schedules && data.schedules.length > 0) {
                    const firstSchedule = data.schedules[0];
                    const { datePart } = parseIsoToLocal(firstSchedule.startTime);
                    setMainEventDate(datePart);

                    const mappedSchedules = data.schedules.map(sch => ({
                        timeStart: parseIsoToLocal(sch.startTime).timePart,
                        timeEnd: parseIsoToLocal(sch.endTime).timePart,
                        maxCapacity: sch.maxCapacity
                    }));
                    setLocalSchedules(mappedSchedules);
                }

            } catch (error) {
                console.error('이벤트 정보 불러오기 실패:', error);
                await Swal.fire({
                    icon: 'error',
                    title: '불러오기 실패',
                    text: '이벤트 정보를 불러오는데 실패했습니다.',
                    confirmButtonColor: '#4F46E5',
                    confirmButtonText: '확인'
                });
                navigate('/host/dashboard');
            } finally {
                setIsFetching(false);
            }
        };

        fetchEventDetails();
    }, [isEditMode, eventId, navigate]);


    // --- 기본 핸들러 ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEventData({ ...eventData, [e.target.name]: e.target.value });
    };

    // --- 스케줄 관련 핸들러 ---
    const handleCapacityChange = (index: number, value: string) => {
        const capacity = parseInt(value);
        if (isNaN(capacity) || capacity < 0) return;
        const newSchedules = localSchedules.map((schedule, i) => {
            if (i === index) { return { ...schedule, maxCapacity: capacity }; } 
            return schedule;
        });
        setLocalSchedules(newSchedules);
    };

    const handleScheduleTimeChange = (index: number, field: 'timeStart' | 'timeEnd', value: string) => { 
        const newSchedules = localSchedules.map((schedule, i) => {
            if (i === index) { return { ...schedule, [field]: value }; }
            return schedule;
        });
        setLocalSchedules(newSchedules);
    };

    const handleAddSchedule = () => {
        const newSchedule: LocalScheduleState = { timeStart: '17:00', timeEnd: '18:00', maxCapacity: 50 }; 
        setLocalSchedules([...localSchedules, newSchedule]);
    };
    
    const handleRemoveSchedule = (index: number) => {
        const newSchedules = localSchedules.filter((_, i) => i !== index);
        setLocalSchedules(newSchedules);
    };

    // --- 질문 관련 핸들러 ---
    const handleAddQuestion = () => {
        const newQuestion: QuestionRequest = { 
            questionType: 'TEXT', 
            questionText: '', 
            isRequired: false 
        };
        setEventData(prev => ({ 
            ...prev, 
            questions: [...prev.questions, newQuestion] 
        }));
    };

    const handleQuestionTextChange = (index: number, newText: string) => {
        const newQuestions = [...eventData.questions];
        newQuestions[index] = { ...newQuestions[index], questionText: newText };
        setEventData(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleRemoveQuestion = async (index: number) => {
        if (eventData.questions[index].isRequired) {
            await Swal.fire({
                icon: 'warning',
                title: '삭제 불가',
                text: '이름, 연락처 등의 필수 질문은 삭제할 수 없습니다.',
                confirmButtonColor: '#4F46E5',
                confirmButtonText: '확인'
            });
            return;
        }
        const newQuestions = eventData.questions.filter((_, i) => i !== index);
        setEventData(prev => ({ ...prev, questions: newQuestions }));
    };

    // --- [변경] 이미지 업로드 및 순서 관리 핸들러 ---
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                await Swal.fire({
                    icon: 'warning',
                    title: '세션 만료',
                    text: '로그인 세션이 만료되었습니다.',
                    confirmButtonColor: '#4F46E5',
                    confirmButtonText: '확인'
                });
                setIsUploading(false);
                return;
            }

            const newImageUrls: string[] = [];

            // 다중 파일 순차 업로드
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileType = file.type || 'application/octet-stream';
                
                const presignResponse = await axios.post<PresignedUrlResponse>(
                    PRESIGNED_URL_API,
                    { fileName: file.name, contentType: fileType },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const { presignedUrl, fileUrl } = presignResponse.data;

                await axios.put(presignedUrl, file, {
                    headers: { 'Content-Type': fileType }
                });

                newImageUrls.push(fileUrl);
            }

            // 기존 이미지 뒤에 새 이미지 추가
            setEventData(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }));

        } catch (error) {
            console.error("이미지 업로드 실패:", error);
            await Swal.fire({
                icon: 'error',
                title: '업로드 실패',
                text: '이미지 업로드 중 오류가 발생했습니다.',
                confirmButtonColor: '#4F46E5',
                confirmButtonText: '확인'
            });
        } finally {
            setIsUploading(false);
            // 같은 파일 다시 선택 가능하도록 input 값 초기화는 DOM 레벨에서 처리됨 (리렌더링)
        }
    };

    const handleRemoveImage = (index: number) => {
        setEventData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleMoveImage = (index: number, direction: 'left' | 'right') => {
        const newImages = [...eventData.images];
        if (direction === 'left' && index > 0) {
            [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
        } else if (direction === 'right' && index < newImages.length - 1) {
            [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
        }
        setEventData(prev => ({ ...prev, images: newImages }));
    };


    // --- 게시/수정 핸들러 ---
    const handlePublish = async () => {
        if (isSaving || isUploading) {
            await Swal.fire({
                icon: 'info',
                title: '작업 중',
                text: '작업 중입니다. 잠시만 기다려주세요.',
                confirmButtonColor: '#4F46E5',
                confirmButtonText: '확인'
            });
            return;
        }

        if (!eventData.title.trim()) {
            await Swal.fire({
                icon: 'warning',
                title: '행사명 필요',
                text: '행사명은 필수입니다.',
                confirmButtonColor: '#4F46E5',
                confirmButtonText: '확인'
            });
            return;
        }
        if (localSchedules.length === 0) {
            await Swal.fire({
                icon: 'warning',
                title: '일정 필요',
                text: '최소 하나의 일정이 필요합니다.',
                confirmButtonColor: '#4F46E5',
                confirmButtonText: '확인'
            });
            return;
        }
        // [변경] 이미지 체크
        if (eventData.images.length === 0) {
            await Swal.fire({
                icon: 'warning',
                title: '이미지 필요',
                text: '최소 한 장의 이미지가 필요합니다.',
                confirmButtonColor: '#4F46E5',
                confirmButtonText: '확인'
            });
            return;
        }

        setIsSaving(true);
        
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                await Swal.fire({
                    icon: 'warning',
                    title: '로그인 필요',
                    text: '로그인이 필요합니다.',
                    confirmButtonColor: '#4F46E5',
                    confirmButtonText: '확인'
                });
                return;
            }
            
            const schedulesToRequest: ScheduleRequest[] = localSchedules.map(schedule => ({
                startTime: toIsoString(mainEventDate, schedule.timeStart),
                endTime: toIsoString(mainEventDate, schedule.timeEnd),
                maxCapacity: schedule.maxCapacity,
            }));

            const finalRequestData: CreateEventRequest = {
                ...eventData,
                schedules: schedulesToRequest,
            }

            if (isEditMode && eventId) {
                await axios.put<EventResponse>(
                    `${API_BASE_URL}/${eventId}`,
                    finalRequestData,
                    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                );
                await Swal.fire({
                    icon: 'success',
                    title: '수정 완료',
                    text: '이벤트가 성공적으로 수정되었습니다.',
                    confirmButtonColor: '#4F46E5',
                    confirmButtonText: '확인'
                });
            } else {
                await axios.post<EventResponse>(
                    API_BASE_URL,
                    finalRequestData,
                    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                );
                await Swal.fire({
                    icon: 'success',
                    title: '게시 완료',
                    text: '이벤트가 성공적으로 게시되었습니다.',
                    confirmButtonColor: '#4F46E5',
                    confirmButtonText: '확인'
                });
            }

            navigate('/host/dashboard');

        } catch (error) {
            console.error('저장 실패:', error);
            if (axios.isAxiosError(error) && error.response) {
                await Swal.fire({
                    icon: 'error',
                    title: '저장 실패',
                    text: error.response.data.message || '서버 오류가 발생했습니다.',
                    confirmButtonColor: '#4F46E5',
                    confirmButtonText: '확인'
                });
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: '오류 발생',
                    text: '알 수 없는 오류가 발생했습니다.',
                    confirmButtonColor: '#4F46E5',
                    confirmButtonText: '확인'
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isFetching) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                 <div className="text-indigo-600 font-bold text-xl"><Loader2 className="animate-spin inline mr-2"/>정보 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 h-screen flex overflow-hidden font-[Pretendard]">
            {/* [왼쪽 패널] 에디터 */}
            <aside className="w-2/3 min-w-[600px] bg-white border-r flex flex-col h-full z-10"> 
                <div className="h-16 border-b flex items-center px-6 justify-between shrink-0">
                    <h1 className="font-bold text-lg">
                        {isEditMode ? '이벤트 수정하기' : '새 이벤트 만들기'}
                    </h1>
                    <button onClick={() => navigate('/host/dashboard')} className="text-gray-400 hover:text-gray-600"><X /></button> 
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* 1. 이미지 업로드 섹션 (변경됨) */}
                    <section>
                        <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">1. 대표 이미지 설정</h2>
                        
                        <div className="mb-4">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                {isUploading ? (
                                    <div className="text-indigo-600 flex flex-col items-center">
                                        <Loader2 className="animate-spin text-2xl mb-2" />
                                        <p className="text-sm">업로드 중...</p>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 flex flex-col items-center">
                                        <Upload className="mb-2 text-2xl" />
                                        <p className="text-sm">클릭하여 이미지 추가 (여러 장 가능)</p>
                                    </div>
                                )}
                                <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={isUploading} className="hidden" />
                            </label>
                        </div>

                        {/* 업로드된 이미지 리스트 및 순서 변경 */}
                        {eventData.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-4">
                                {eventData.images.map((url, idx) => (
                                    <div key={idx} className="relative group bg-gray-100 rounded-lg overflow-hidden border aspect-[4/3] shadow-sm">
                                        <img src={url} alt={`event-${idx}`} className="w-full h-full object-cover" />
                                        
                                        {/* 순서 표시 배지 */}
                                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm font-bold">
                                            {idx === 0 ? '대표' : idx + 1}
                                        </div>

                                        {/* 컨트롤 오버레이 (Hover 시 표시) */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => handleMoveImage(idx, 'left')} 
                                                disabled={idx === 0} 
                                                className="p-1.5 bg-white rounded-full hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                title="앞으로 이동"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleRemoveImage(idx)} 
                                                className="p-1.5 bg-white text-red-500 rounded-full hover:bg-red-50 transition"
                                                title="삭제"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleMoveImage(idx, 'right')} 
                                                disabled={idx === eventData.images.length - 1} 
                                                className="p-1.5 bg-white rounded-full hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                title="뒤로 이동"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                    <hr />

                    {/* 2. 기본 정보 */}
                    <section>
                        <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">2. 기본 정보</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">행사명</label>
                                <input type="text" name="title" value={eventData.title} onChange={handleChange} placeholder="예: 2024 경영학과 일일호프" className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">행사 날짜</label>
                                <input type="date" value={mainEventDate} onChange={(e) => setMainEventDate(e.target.value)} className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">장소</label>
                                <input type="text" name="location" value={eventData.location} onChange={handleChange} placeholder="예: 서울 강남구 테헤란로 123" className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">설명</label>
                                <textarea name="description" value={eventData.description} onChange={handleChange} rows={5} placeholder="행사에 대한 자세한 설명을 적어주세요." className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/>
                            </div>
                        </div>
                    </section>
                    <hr />

                    {/* 3. 일정 설정 */}
                    <section>
                        <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">3. 일정 및 티켓 설정</h2>
                        <div className="space-y-3">
                            {localSchedules.map((schedule, index) => (
                                <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border">
                                    <input type="time" value={schedule.timeStart} onChange={(e) => handleScheduleTimeChange(index, 'timeStart', e.target.value)} className="bg-white border px-2 py-1 rounded text-sm font-bold outline-none" />
                                    <span>~</span>
                                    <input type="time" value={schedule.timeEnd} onChange={(e) => handleScheduleTimeChange(index, 'timeEnd', e.target.value)} className="bg-white border px-2 py-1 rounded text-sm font-bold outline-none" />
                                    <div className="flex-1"></div>
                                    <span className="text-sm text-gray-500">정원:</span>
                                    <input type="number" value={schedule.maxCapacity} onChange={(e) => handleCapacityChange(index, e.target.value)} className="w-16 border rounded p-1 text-center font-bold" min="1"/>
                                    <button onClick={() => handleRemoveSchedule(index)} className="bg-white border border-gray-300 text-gray-400 hover:text-red-500 hover:border-red-500 w-8 h-8 rounded flex items-center justify-center transition"><Trash2 size={14}/></button>
                                </div>
                            ))}
                            <button onClick={handleAddSchedule} className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-lg font-bold hover:bg-indigo-50 transition">+ 시간대 추가하기</button>
                        </div>
                    </section>
                    <hr />

                    {/* 4. 질문지 설계 */}
                    <section>
                        <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">4. 질문지 설계</h2>
                        <div className="space-y-3">
                            {eventData.questions.map((question, index) => (
                                <div key={index} className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${question.isRequired ? 'bg-gray-100 border-gray-200' : 'bg-white border-indigo-100 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500'}`}>
                                    {question.isRequired ? (
                                        <div className="w-8 h-8 flex items-center justify-center text-gray-400" title="필수 항목"><i className="fas fa-lock"></i></div>
                                    ) : (
                                        <div className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded text-xs font-bold">Q</div>
                                    )}
                                    
                                    <input 
                                        type="text" 
                                        value={question.questionText} 
                                        onChange={(e) => handleQuestionTextChange(index, e.target.value)}
                                        disabled={question.isRequired}
                                        placeholder="질문 내용을 입력하세요"
                                        className={`flex-1 bg-transparent border-none outline-none font-medium ${question.isRequired ? 'text-gray-500 cursor-not-allowed' : 'text-gray-800 placeholder-gray-300'}`}
                                    />
                                    
                                    {!question.isRequired && (
                                        <button onClick={() => handleRemoveQuestion(index)} className="text-gray-300 hover:text-red-500 w-8 h-8 flex items-center justify-center transition">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={handleAddQuestion} className="text-sm text-indigo-600 font-bold hover:underline py-2">+ 질문 추가하기</button>
                        </div>
                    </section>
                </div>

                <div className="p-6 border-t bg-white flex gap-3 shrink-0">
                    <button onClick={() => navigate('/host/dashboard')} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition">
                        취소
                    </button>
                    <button onClick={handlePublish} disabled={isSaving || isUploading} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 ${(isSaving || isUploading) ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                        {(isSaving || isUploading) ? '처리 중...' : (isEditMode ? '수정 완료' : '게시하기')}
                    </button>
                </div>
            </aside>

            {/* [오른쪽 패널] 모바일 미리보기 (변경됨) */}
            <main className="w-1/3 bg-gray-200 flex items-center justify-center p-8 relative"> 
                <div className="w-[375px] h-[720px] bg-white rounded-[3rem] border-[12px] border-gray-900 shadow-2xl overflow-hidden relative flex flex-col">
                    {/* 노치 디자인 */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-xl z-30"></div>
                    
                    {/* 브라우저 주소창 */}
                    <div className="bg-white border-b pt-10 pb-2 px-4 z-20">
                        <div className="bg-gray-100 rounded-lg py-2 px-3 flex items-center gap-2 text-xs text-gray-500">
                            <i className="fas fa-lock text-[10px]"></i>
                            <span className="truncate flex-1 font-mono">
                                {SERVICE_DOMAIN}/{isEditMode ? previewCode : 'ticket_code'}
                            </span>
                            <i className="fas fa-rotate-right"></i>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                        {/* 썸네일 (대표 이미지 or 첫 번째 이미지) */}
                        <div className="h-64 bg-gray-100 relative">
                            {eventData.images.length > 0 ? (
                                <>
                                    <img src={eventData.images[0]} alt="대표" className="h-full w-full object-cover"/>
                                    {eventData.images.length > 1 && (
                                        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full font-medium">
                                            1 / {eventData.images.length}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <Upload className="text-3xl mb-2 opacity-50" />
                                    <span className="text-xs">이미지 없음</span>
                                </div>
                            )}
                        </div>
                        
                        {/* 본문 */}
                        <div className="p-6">
                            <h1 className="text-2xl font-bold mb-2 leading-tight break-keep">
                                {eventData.title || '행사 제목을 입력하세요'}
                            </h1>
                            <div className="text-sm text-gray-500 mb-6 flex flex-col gap-1">
                                <span className="flex items-center gap-1"><i className="far fa-calendar"></i> {mainEventDate || '0000-00-00'}</span>
                                <span className="flex items-center gap-1"><i className="fas fa-map-marker-alt"></i> {eventData.location || '장소 미정'}</span>
                            </div>

                            {eventData.description && (
                                <div className="mb-8 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed border-l-2 border-gray-200 pl-3">
                                    {eventData.description}
                                </div>
                            )}

                            {/* 티켓 선택 */}
                            <h3 className="font-bold text-gray-800 mb-3 text-sm">티켓 선택</h3>
                            <div className="grid grid-cols-2 gap-2 mb-8">
                                {localSchedules.map((s, i) => (
                                    <div key={i} className="border p-3 rounded-lg text-center cursor-pointer hover:border-indigo-500 hover:text-indigo-600 transition">
                                        <div className="text-sm font-bold">{s.timeStart}</div>
                                        <div className="text-xs text-gray-400">잔여 {s.maxCapacity}</div>
                                    </div>
                                ))}
                            </div>

                            {/* 질문 리스트 */}
                            <h3 className="font-bold text-gray-800 mb-3 text-sm">신청 정보</h3>
                            <div className="space-y-3 pb-10">
                                {eventData.questions.map((q, i) => (
                                    <div key={i} className="border border-gray-200 bg-gray-50 rounded px-3 py-3">
                                        <div className="text-xs text-gray-500 mb-1">
                                            {q.questionText || '질문 내용'} {q.isRequired && <span className="text-red-500">*</span>}
                                        </div>
                                        <div className="h-6 bg-white border border-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* 하단 버튼 예시 */}
                    <div className="p-4 border-t bg-white">
                         <div className="w-full bg-gray-900 text-white text-center py-3 rounded-xl font-bold text-sm">
                             예매하기
                         </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HostEventCreatePage;