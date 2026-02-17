// src/pages/host/HostEventCreatePage.tsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { authAxios, getAccessToken } from '../../api/authApi';
import {
    X,
    Upload,
    Trash2,
    Loader2,
    GripVertical,
    Star,
    Image as ImageIcon,
    Plus
} from 'lucide-react';

// dnd-kit (이미지 순서 변경용)
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 마크다운 에디터 라이브러리
import MDEditor, { commands, ICommand } from '@uiw/react-md-editor';

// =================================================================
// 1. 환경별 URL 및 상수 정의
// =================================================================
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SERVICE_DOMAIN = IS_PRODUCTION ? 'form-pass.life' : 'localhost:3000';
const API_HOST = IS_PRODUCTION ? 'https://api.form-pass.life' : 'http://localhost:8080';
const API_BASE_URL = `${API_HOST}/api/host/events`;
const PRESIGNED_URL_API = `${API_HOST}/api/host/s3/presigned-url`;

// SweetAlert2 공통 스타일 설정 (Form PASS 브랜드 테마)
const SWAL_THEME = {
  customClass: {
    popup: 'rounded-[2rem] shadow-2xl',
    title: 'text-xl font-bold text-slate-900',
    htmlContainer: 'text-slate-600 text-sm',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 py-3 mx-1 shadow-md hover:shadow-lg transition-all',
    cancelButton: 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl px-6 py-3 mx-1 transition-all',
    denyButton: 'bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl px-6 py-3 mx-1 transition-all',
  },
  buttonsStyling: false,
};

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
  images: string[];
  description: string;
  schedules: ScheduleRequest[];
  questions: QuestionRequest[];
}

interface EventResponse {
    id: number;
    title: string;
    location: string;
    images: string[];
    thumbnailUrl?: string;
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
// 3. 서브 컴포넌트 (SortableImage)
// =================================================================
interface SortableImageProps {
  id: string; // 이미지 URL을 ID로 사용
  url: string;
  index: number;
  onRemove: (index: number) => void;
}

const SortableImage = ({ id, url, index, onRemove }: SortableImageProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-gray-100 rounded-xl overflow-hidden border aspect-[4/3] shadow-sm
        ${isDragging
            ? 'scale-105 shadow-xl ring-2 ring-blue-500 opacity-80'
            : 'hover:border-blue-300 hover:shadow-md transition-all duration-200'
        }`}
    >
      <img src={url} alt={`event-${index}`} className="w-full h-full object-cover" />

      {/* 순서 및 대표 배지 */}
      <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg backdrop-blur-md font-bold text-[10px] flex items-center gap-1 shadow-md ${
        index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'bg-black/60 text-white'
      }`}>
        {index === 0 && <Star size={10} fill="currentColor" />}
        {index === 0 ? '대표' : index + 1}
      </div>

      {/* 컨트롤 오버레이 (Hover 시 표시) */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
        {/* 드래그 핸들 */}
        <div
          {...attributes}
          {...listeners}
          className="p-2.5 bg-white rounded-xl cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors text-gray-700 shadow-md"
          title="드래그하여 순서 변경"
        >
          <GripVertical size={18} />
        </div>

        {/* 삭제 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          className="p-2.5 bg-white text-red-500 rounded-xl hover:bg-red-50 transition-colors shadow-md"
          title="삭제"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

// =================================================================
// 4. 초기값 상수 (컴포넌트 외부에 정의)
// =================================================================

const INITIAL_QUESTIONS: QuestionRequest[] = [
    { questionType: 'TEXT', questionText: '이름', isRequired: true },
    { questionType: 'TEXT', questionText: '연락처', isRequired: true },
];

const INITIAL_LOCAL_SCHEDULES: LocalScheduleState[] = [
    { timeStart: '14:00', timeEnd: '15:00', maxCapacity: 30 },
];

// =================================================================
// 5. 메인 컴포넌트 로직
// =================================================================

const HostEventCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();
    const isEditMode = Boolean(eventId);

    // --- 상태 정의 ---
    const [mainEventDate, setMainEventDate] = useState('');

    const [eventData, setEventData] = useState({
        title: '',
        location: '',
        images: [] as string[],
        description: '', // 마크다운 텍스트 저장
        questions: INITIAL_QUESTIONS,
    });

    const [localSchedules, setLocalSchedules] = useState<LocalScheduleState[]>(INITIAL_LOCAL_SCHEDULES);
    const [previewCode, setPreviewCode] = useState('AbC1d');

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // 에디터 파일 입력창 제어용 Ref
    const editorFileInputRef = useRef<HTMLInputElement>(null);

    // --- dnd-kit 센서 설정 ---
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
            // 토큰이 없으면 로그인 페이지로 리다이렉트
            if (!getAccessToken()) {
                navigate('/login');
                return;
            }

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
                const response = await authAxios.get<EventResponse>(`${API_BASE_URL}/${eventId}`);

                const data = response.data;
                const loadedImages = data.images && data.images.length > 0
                    ? data.images
                    : (data.thumbnailUrl ? [data.thumbnailUrl] : []);

                setEventData({
                    title: data.title,
                    location: data.location || '',
                    images: loadedImages,
                    description: data.description || '',
                    questions: data.questions || INITIAL_QUESTIONS,
                });

                if (data.eventCode) setPreviewCode(data.eventCode);

                if (data.schedules && data.schedules.length > 0) {
                    const firstSchedule = data.schedules[0];
                    const { datePart } = parseIsoToLocal(firstSchedule.startTime);
                    setMainEventDate(datePart);
                    setLocalSchedules(data.schedules.map(sch => ({
                        timeStart: parseIsoToLocal(sch.startTime).timePart,
                        timeEnd: parseIsoToLocal(sch.endTime).timePart,
                        maxCapacity: sch.maxCapacity
                    })));
                }
            } catch (error: any) {
                console.error(error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    await Swal.fire({
                        icon: 'warning',
                        title: '로그인 필요',
                        text: '로그인이 필요합니다.',
                        confirmButtonText: '로그인하러 가기',
                        ...SWAL_THEME,
                    });
                    navigate('/login');
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: '데이터 로드 실패',
                        text: '이벤트 정보를 불러오지 못했습니다.',
                        confirmButtonText: '확인',
                        ...SWAL_THEME,
                    });
                    navigate('/host/dashboard');
                }
            } finally {
                setIsFetching(false);
            }
        };
        fetchEventDetails();
    }, [isEditMode, eventId, navigate]);


    // =================================================================
    // [이미지 업로드 로직] S3 공통 함수 및 에디터 핸들러
    // =================================================================

    // 1. S3 업로드 공통 함수 (썸네일 & 에디터 둘 다 사용)
    const uploadImageToS3 = async (file: File): Promise<string> => {
        const fileType = file.type || 'application/octet-stream';

        // 1) Presigned URL 요청
        const presignResponse = await authAxios.post<PresignedUrlResponse>(
            PRESIGNED_URL_API,
            { fileName: file.name, contentType: fileType }
        );

        const { presignedUrl, fileUrl } = presignResponse.data;

        // 2) S3에 PUT 업로드 (S3 직접 업로드는 Authorization 불필요)
        await axios.put(presignedUrl, file, {
            headers: { 'Content-Type': fileType }
        });

        return fileUrl;
    };

    // 2. 에디터에 이미지 삽입하는 헬퍼 함수
    const insertImageToEditor = async (file: File) => {
        try {
            // 커서 위치 찾기 (없으면 맨 뒤)
            const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
            const cursorPosition = textarea?.selectionStart || eventData.description.length;

            const textBefore = eventData.description.substring(0, cursorPosition);
            const textAfter = eventData.description.substring(cursorPosition);

            // 로딩 중 표시
            setEventData(prev => ({
                ...prev,
                description: `${textBefore}![업로드 중...](${'...'})${textAfter}`
            }));

            const url = await uploadImageToS3(file);

            // 실제 URL로 교체
            setEventData(prev => ({
                ...prev,
                description: `${textBefore}![image](${url})${textAfter}`
            }));

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: '이미지 업로드 실패',
                text: '에디터에 이미지를 삽입하지 못했습니다.',
                confirmButtonText: '확인',
                ...SWAL_THEME,
            });
        }
    };

    // 3. 에디터: 붙여넣기(Paste) 핸들러
    const onPaste = async (event: any) => {
        const dataTransfer = event.clipboardData;
        if (dataTransfer.files && dataTransfer.files.length > 0) {
            event.preventDefault();
            const file = dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                await insertImageToEditor(file);
            }
        }
    };

    // 4. 에디터: 드래그 앤 드롭(Drop) 핸들러
    const onDrop = async (event: any) => {
        event.preventDefault();
        const dataTransfer = event.dataTransfer;
        if (dataTransfer.files && dataTransfer.files.length > 0) {
            const file = dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                await insertImageToEditor(file);
            }
        }
    };

    // 5. 에디터: 툴바 아이콘 클릭 시 실행될 함수 -> 숨겨진 input 클릭
    const handleEditorImageBtnClick = () => {
        editorFileInputRef.current?.click();
    };

    // 6. 에디터: 숨겨진 input에서 파일 선택 시 실행
    const onEditorImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            await insertImageToEditor(file);
        }
        e.target.value = ''; // 초기화 (같은 파일 다시 선택 가능)
    };

    // 7. 커스텀 툴바 커맨드 정의
    const imageCustomCommand: ICommand = {
        name: 'image-upload',
        keyCommand: 'image-upload',
        buttonProps: { 'aria-label': '이미지 업로드' },
        icon: (
            <span className="flex items-center justify-center">
                <ImageIcon size={12} />
            </span>
        ),
        execute: (state, api) => {
            handleEditorImageBtnClick(); // 파일 선택창 오픈
        },
    };


    // --- 일반 핸들러 ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEventData({ ...eventData, [e.target.name]: e.target.value });
    };

    const handleCapacityChange = (index: number, value: string) => {
        const capacity = parseInt(value);
        if (isNaN(capacity) || capacity < 0) return;
        const newSchedules = localSchedules.map((schedule, i) => i === index ? { ...schedule, maxCapacity: capacity } : schedule);
        setLocalSchedules(newSchedules);
    };

    const handleScheduleTimeChange = (index: number, field: 'timeStart' | 'timeEnd', value: string) => {
        const newSchedules = localSchedules.map((schedule, i) => i === index ? { ...schedule, [field]: value } : schedule);
        setLocalSchedules(newSchedules);
    };

    const handleAddSchedule = () => {
        setLocalSchedules([...localSchedules, { timeStart: '17:00', timeEnd: '18:00', maxCapacity: 50 }]);
    };

    const handleRemoveSchedule = (index: number) => {
        setLocalSchedules(localSchedules.filter((_, i) => i !== index));
    };

    const handleAddQuestion = () => {
        setEventData(prev => ({ ...prev, questions: [...prev.questions, { questionType: 'TEXT', questionText: '', isRequired: false }] }));
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
                text: '필수 질문은 삭제할 수 없습니다.',
                confirmButtonText: '확인',
                ...SWAL_THEME,
            });
            return;
        }
        setEventData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
    };

    // --- 대표 이미지(썸네일) 업로드 핸들러 ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop()?.toLowerCase();

            if (!fileExt || !allowedExtensions.includes(fileExt)) {
                await Swal.fire({
                    icon: 'error',
                    title: '지원하지 않는 파일 형식',
                    html: `<strong>${file.name}</strong>은(는) 업로드할 수 없습니다.<br><br>허용 형식: <strong>jpg, jpeg, png, gif, webp</strong>`,
                    confirmButtonText: '확인',
                    ...SWAL_THEME,
                });
                e.target.value = '';
                return;
            }

            if (!file.type.startsWith('image/')) {
                 await Swal.fire({
                    icon: 'error',
                    title: '잘못된 파일 형식',
                    text: '이미지 파일만 선택해주세요.',
                    confirmButtonText: '확인',
                    ...SWAL_THEME,
                });
                e.target.value = '';
                return;
            }
        }

        setIsUploading(true);
        try {
            const newImageUrls: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const url = await uploadImageToS3(file); // 공통 함수 재사용
                newImageUrls.push(url);
            }
            setEventData(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }));
        } catch (error) {
            console.error("업로드 실패:", error);
            await Swal.fire({
                icon: 'error',
                title: '업로드 실패',
                text: '이미지 업로드 중 오류가 발생했습니다. 파일 크기나 네트워크를 확인해주세요.',
                confirmButtonText: '확인',
                ...SWAL_THEME,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = (index: number) => {
        setEventData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    // 드래그 종료 핸들러 (이미지 순서 변경)
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = eventData.images.indexOf(active.id as string);
            const newIndex = eventData.images.indexOf(over.id as string);
            setEventData(prev => ({
                ...prev,
                images: arrayMove(prev.images, oldIndex, newIndex)
            }));
        }
    };


    // --- 게시/수정 핸들러 ---
    const handlePublish = async () => {
        if (isSaving || isUploading) return;
        if (!eventData.title.trim() || localSchedules.length === 0 || eventData.images.length === 0) {
            await Swal.fire({
                icon: 'warning',
                title: '필수 정보 누락',
                html: '다음 항목은 필수입니다:<br><br>✓ 행사명<br>✓ 일정 (최소 1개)<br>✓ 대표 이미지 (최소 1개)',
                confirmButtonText: '확인',
                ...SWAL_THEME,
            });
            return;
        }

        setIsSaving(true);
        try {
            const schedulesToRequest: ScheduleRequest[] = localSchedules.map(schedule => ({
                startTime: toIsoString(mainEventDate, schedule.timeStart),
                endTime: toIsoString(mainEventDate, schedule.timeEnd),
                maxCapacity: schedule.maxCapacity,
            }));

            const finalRequestData: CreateEventRequest = { ...eventData, schedules: schedulesToRequest };

            if (isEditMode && eventId) {
                await authAxios.put(`${API_BASE_URL}/${eventId}`, finalRequestData);
                await Swal.fire({
                    icon: 'success',
                    title: '수정 완료',
                    text: '이벤트가 성공적으로 수정되었습니다.',
                    confirmButtonText: '대시보드로',
                    timer: 2000,
                    timerProgressBar: true,
                    ...SWAL_THEME,
                });
            } else {
                await authAxios.post(API_BASE_URL, finalRequestData);
                await Swal.fire({
                    icon: 'success',
                    title: '게시 완료',
                    text: '이벤트가 성공적으로 게시되었습니다!',
                    confirmButtonText: '대시보드로',
                    timer: 2000,
                    timerProgressBar: true,
                    ...SWAL_THEME,
                });
            }
            navigate('/host/dashboard');
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: '작업 실패',
                text: error.response?.data?.message || '이벤트 저장 중 오류가 발생했습니다.',
                confirmButtonText: '확인',
                ...SWAL_THEME,
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isFetching) return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10"/>
      </div>
    );

    return (
        <div className="bg-gradient-to-br from-gray-100 to-slate-100 h-screen flex overflow-hidden font-[Pretendard]">
            {/* [왼쪽 패널] 에디터 */}
            <aside className="w-2/3 min-w-[600px] bg-white border-r border-gray-200/80 flex flex-col h-full z-10 shadow-xl">
                <div className="h-16 border-b border-gray-100 flex items-center px-6 justify-between shrink-0 bg-white/80 backdrop-blur-sm">
                    <h1 className="font-bold text-lg text-gray-800">{isEditMode ? '이벤트 수정하기' : '새 이벤트 만들기'}</h1>
                    <button onClick={() => navigate('/host/dashboard')} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"><X /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* 1. 이미지 업로드 및 드래그 섹션 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="section-badge">1</div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">대표 이미지 설정</h2>
                                <span className="text-xs text-gray-400">드래그하여 순서 변경 (첫 번째가 대표)</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 transition-all duration-200 group">
                                {isUploading ? (
                                    <div className="text-blue-600 flex flex-col items-center">
                                        <Loader2 className="animate-spin text-2xl mb-2" />
                                        <p className="text-sm font-medium">업로드 중...</p>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center group-hover:text-blue-600 transition-colors">
                                        <Upload className="mb-2 text-2xl" />
                                        <p className="text-sm font-medium">클릭하여 이미지 추가 (여러 장 가능)</p>
                                        <p className="text-xs mt-1 text-gray-400">(jpg, jpeg, png, gif, webp만 가능)</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept=".jpg, .jpeg, .png, .gif, .webp, image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* dnd-kit 적용된 이미지 그리드 */}
                        {eventData.images.length > 0 && (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={eventData.images} strategy={rectSortingStrategy}>
                                    <div className="grid grid-cols-4 gap-4">
                                        {eventData.images.map((url, idx) => (
                                            <SortableImage
                                                key={url}
                                                id={url}
                                                url={url}
                                                index={idx}
                                                onRemove={handleRemoveImage}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </section>
                    <hr className="border-gray-100" />

                    {/* 2. 기본 정보 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="section-badge">2</div>
                            <h2 className="text-sm font-bold text-gray-800">기본 정보</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">행사명</label>
                                <input type="text" name="title" value={eventData.title} onChange={handleChange} placeholder="예: 2024 경영학과 일일호프" className="input-standard"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">행사 날짜</label>
                                <input type="date" value={mainEventDate} onChange={(e) => setMainEventDate(e.target.value)} className="input-standard"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">장소</label>
                                <input type="text" name="location" value={eventData.location} onChange={handleChange} placeholder="예: 서울 강남구 테헤란로 123" className="input-standard"/>
                            </div>

                            {/* 마크다운 에디터 적용 부분 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                                <div data-color-mode="light" onPaste={onPaste} onDrop={onDrop}>

                                    {/* 에디터용 숨겨진 파일 인풋 */}
                                    <input
                                        type="file"
                                        ref={editorFileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={onEditorImageFileChange}
                                    />

                                    <MDEditor
                                        value={eventData.description}
                                        onChange={(val) => setEventData(prev => ({ ...prev, description: val || '' }))}
                                        height={400}
                                        preview="edit"
                                        textareaProps={{
                                            placeholder: '행사 내용을 입력하세요. 상단 이미지 버튼을 눌러 이미지를 추가할 수 있습니다.'
                                        }}
                                        commands={[
                                            commands.bold, commands.italic, commands.strikethrough, commands.hr,
                                            commands.title, commands.divider,
                                            commands.link, commands.quote, commands.code, commands.codeBlock,
                                            commands.divider,
                                            imageCustomCommand, // 커스텀 이미지 버튼 적용
                                            commands.table, commands.help
                                        ]}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    * 팁: 이미지를 복사해서 붙여넣거나(Ctrl+V), 드래그해서 넣거나, 상단 이미지 버튼을 눌러 추가하세요.
                                </p>
                            </div>
                        </div>
                    </section>
                    <hr className="border-gray-100" />

                    {/* 3. 일정 설정 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="section-badge">3</div>
                            <h2 className="text-sm font-bold text-gray-800">일정 및 티켓 설정</h2>
                        </div>
                        <div className="space-y-3">
                            {localSchedules.map((schedule, index) => (
                                <div key={index} className="flex gap-3 items-center bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group">
                                    <input type="time" value={schedule.timeStart} onChange={(e) => handleScheduleTimeChange(index, 'timeStart', e.target.value)} className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                                    <span className="text-gray-400">~</span>
                                    <input type="time" value={schedule.timeEnd} onChange={(e) => handleScheduleTimeChange(index, 'timeEnd', e.target.value)} className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                                    <div className="flex-1"></div>
                                    <span className="text-sm text-gray-500 font-medium">정원:</span>
                                    <input type="number" value={schedule.maxCapacity} onChange={(e) => handleCapacityChange(index, e.target.value)} className="w-20 border border-gray-200 rounded-lg p-2 text-center font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" min="1"/>
                                    <button onClick={() => handleRemoveSchedule(index)} className="bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 w-9 h-9 rounded-lg flex items-center justify-center transition-all"><Trash2 size={14}/></button>
                                </div>
                            ))}
                            <button onClick={handleAddSchedule} className="w-full py-3.5 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl font-bold hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2">
                                <Plus size={18} /> 시간대 추가하기
                            </button>
                        </div>
                    </section>
                    <hr className="border-gray-100" />

                    {/* 4. 질문지 설계 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="section-badge">4</div>
                            <h2 className="text-sm font-bold text-gray-800">질문지 설계</h2>
                        </div>
                        <div className="space-y-3">
                            {eventData.questions.map((question, index) => (
                                <div key={index} className={`flex items-center gap-3 p-4 border rounded-xl transition-all ${question.isRequired ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 focus-within:ring-2 focus-within:ring-blue-500/20'}`}>
                                    {question.isRequired ? (
                                        <div className="w-8 h-8 flex items-center justify-center text-gray-400" title="필수 항목"><i className="fas fa-lock"></i></div>
                                    ) : (
                                        <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 rounded-lg text-xs font-bold">Q</div>
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
                            <button onClick={handleAddQuestion} className="text-sm text-blue-600 font-bold hover:underline py-2 flex items-center gap-1">
                                <Plus size={16} /> 질문 추가하기
                            </button>
                        </div>
                    </section>
                </div>

                <div className="p-6 border-t border-gray-100 bg-white/80 backdrop-blur-sm flex gap-3 shrink-0">
                    <button onClick={() => navigate('/host/dashboard')} className="btn-secondary flex-1 py-3">취소</button>
                    <button onClick={handlePublish} disabled={isSaving || isUploading} className={`btn-primary flex-1 py-3 ${(isSaving || isUploading) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        {(isSaving || isUploading) ? '처리 중...' : (isEditMode ? '수정 완료' : '게시하기')}
                    </button>
                </div>
            </aside>

             {/* [오른쪽 패널] 모바일 미리보기 */}
            <main className="w-1/3 bg-gradient-to-br from-slate-200 to-gray-300 flex items-center justify-center p-8 relative">
                <div className="w-[375px] h-[720px] bg-white rounded-[3rem] border-[12px] border-gray-900 shadow-2xl overflow-hidden relative flex flex-col ring-4 ring-black/5">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-xl z-30"></div>
                    <div className="bg-white border-b pt-10 pb-2 px-4 z-20">
                        <div className="bg-gradient-to-r from-gray-100 to-slate-100 rounded-lg py-2 px-3 flex items-center gap-2 text-xs text-gray-500">
                            <i className="fas fa-lock text-[10px]"></i>
                            <span className="truncate flex-1 font-mono">{SERVICE_DOMAIN}/{isEditMode ? previewCode : 'ticket_code'}</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                        <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                            {eventData.images.length > 0 ? (
                                <>
                                    <img src={eventData.images[0]} alt="대표" className="h-full w-full object-cover"/>
                                    {eventData.images.length > 1 && (
                                        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
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
                        <div className="p-6">
                            <h1 className="text-2xl font-bold mb-2 leading-tight break-keep">{eventData.title || '행사 제목을 입력하세요'}</h1>
                            <div className="text-sm text-gray-500 mb-6 flex flex-col gap-1">
                                <span className="flex items-center gap-1"><i className="far fa-calendar"></i> {mainEventDate || '0000-00-00'}</span>
                                <span className="flex items-center gap-1"><i className="fas fa-map-marker-alt"></i> {eventData.location || '장소 미정'}</span>
                            </div>

                            {/* 설명 미리보기 (마크다운 렌더링) */}
                            {eventData.description ? (
                                <div className="mb-8 text-sm text-gray-600 border-l-2 border-gray-200 pl-3 leading-relaxed" data-color-mode="light">
                                    <MDEditor.Markdown
                                        source={eventData.description}
                                        style={{ backgroundColor: 'white', color: '#374151', fontSize: '0.875rem' }}
                                    />
                                </div>
                            ) : (
                                <div className="mb-8 text-sm text-gray-400">내용이 없습니다.</div>
                            )}

                            <h3 className="font-bold text-gray-800 mb-3 text-sm">티켓 선택</h3>
                            <div className="grid grid-cols-2 gap-2 mb-8">
                                {localSchedules.map((s, i) => (
                                    <div key={i} className="border border-gray-200 p-3 rounded-xl text-center cursor-pointer hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all">
                                        <div className="text-sm font-bold">{s.timeStart}</div>
                                        <div className="text-xs text-gray-400">잔여 {s.maxCapacity}</div>
                                    </div>
                                ))}
                            </div>
                            <h3 className="font-bold text-gray-800 mb-3 text-sm">신청 정보</h3>
                            <div className="space-y-3 pb-10">
                                {eventData.questions.map((q, i) => (
                                    <div key={i} className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-3">
                                        <div className="text-xs text-gray-500 mb-1">
                                            {q.questionText || '질문 내용'} {q.isRequired && <span className="text-red-500">*</span>}
                                        </div>
                                        <div className="h-6 bg-white border border-gray-200 rounded-lg"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t bg-white">
                         <div className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white text-center py-3.5 rounded-xl font-bold text-sm shadow-lg">예매하기</div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HostEventCreatePage;
