// src/pages/host/HostEventCreatePage.tsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { SWAL_BASE_OPTIONS } from '../../constants/swalTheme';
import Swal from 'sweetalert2';
import { authAxios, getAccessToken } from '../../api/authApi';
import {
    X,
    Upload,
    Trash2,
    Loader2,
    Image as ImageIcon,
    Plus,
    Calendar,
    MapPin
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

// authAxios는 이미 baseURL을 가지고 있으므로 상대 경로 사용
const API_EVENTS_PATH = '/api/host/events';
const PRESIGNED_URL_PATH = '/api/host/s3/presigned-url';


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
  questionType: 'TEXT' | 'CHECKBOX' | 'RADIO';
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
  id: string;
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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative bg-gray-100 rounded-lg overflow-hidden border aspect-[4/3] select-none ${
        isDragging ? 'ring-2 ring-gray-900 shadow-lg' : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      <img
        src={url}
        alt={`event-${index}`}
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* 순서 배지 */}
      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium pointer-events-none ${
        index === 0 ? 'bg-gray-900 text-white' : 'bg-white/90 text-gray-600'
      }`}>
        {index === 0 ? '대표' : index + 1}
      </div>

      {/* 삭제 버튼 - 항상 표시 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove(index);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
      >
        <X size={12} />
      </button>
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
        description: '',
        questions: INITIAL_QUESTIONS,
    });

    const [localSchedules, setLocalSchedules] = useState<LocalScheduleState[]>(INITIAL_LOCAL_SCHEDULES);
    const [previewCode, setPreviewCode] = useState('AbC1d');

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    const editorFileInputRef = useRef<HTMLInputElement>(null);

    // --- dnd-kit 센서 설정 ---
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px 이동해야 드래그 시작
            },
        }),
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
                const response = await authAxios.get<EventResponse>(`${API_EVENTS_PATH}/${eventId}`);

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
                        ...SWAL_BASE_OPTIONS,
                    });
                    navigate('/login');
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: '데이터 로드 실패',
                        text: '이벤트 정보를 불러오지 못했습니다.',
                        confirmButtonText: '확인',
                        ...SWAL_BASE_OPTIONS,
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
    // [이미지 업로드 로직]
    // =================================================================

    const uploadImageToS3 = async (file: File): Promise<string> => {
        const fileType = file.type || 'application/octet-stream';

        const presignResponse = await authAxios.post<PresignedUrlResponse>(
            PRESIGNED_URL_PATH,
            { fileName: file.name, contentType: fileType }
        );

        const { presignedUrl, fileUrl } = presignResponse.data;

        await axios.put(presignedUrl, file, {
            headers: { 'Content-Type': fileType }
        });

        return fileUrl;
    };

    const insertImageToEditor = async (file: File) => {
        try {
            const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
            const cursorPosition = textarea?.selectionStart || eventData.description.length;

            const textBefore = eventData.description.substring(0, cursorPosition);
            const textAfter = eventData.description.substring(cursorPosition);

            setEventData(prev => ({
                ...prev,
                description: `${textBefore}![업로드 중...](${'...'})${textAfter}`
            }));

            const url = await uploadImageToS3(file);

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
                ...SWAL_BASE_OPTIONS,
            });
        }
    };

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

    const handleEditorImageBtnClick = () => {
        editorFileInputRef.current?.click();
    };

    const onEditorImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            await insertImageToEditor(file);
        }
        e.target.value = '';
    };

    const imageCustomCommand: ICommand = {
        name: 'image-upload',
        keyCommand: 'image-upload',
        buttonProps: { 'aria-label': '이미지 업로드' },
        icon: (
            <span className="flex items-center justify-center">
                <ImageIcon size={12} />
            </span>
        ),
        execute: () => {
            handleEditorImageBtnClick();
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
                ...SWAL_BASE_OPTIONS,
            });
            return;
        }
        setEventData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
    };

    // --- 대표 이미지 업로드 핸들러 ---
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
                    ...SWAL_BASE_OPTIONS,
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
                    ...SWAL_BASE_OPTIONS,
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
                const url = await uploadImageToS3(file);
                newImageUrls.push(url);
            }
            setEventData(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }));
        } catch (error) {
            console.error("업로드 실패:", error);
            await Swal.fire({
                icon: 'error',
                title: '업로드 실패',
                text: '이미지 업로드 중 오류가 발생했습니다.',
                confirmButtonText: '확인',
                ...SWAL_BASE_OPTIONS,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = (index: number) => {
        setEventData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

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
                html: '다음 항목은 필수입니다:<br><br>• 행사명<br>• 일정 (최소 1개)<br>• 대표 이미지 (최소 1개)',
                confirmButtonText: '확인',
                ...SWAL_BASE_OPTIONS,
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
                await authAxios.put(`${API_EVENTS_PATH}/${eventId}`, finalRequestData);
                await Swal.fire({
                    icon: 'success',
                    title: '수정 완료',
                    text: '이벤트가 성공적으로 수정되었습니다.',
                    confirmButtonText: '확인',
                    timer: 2000,
                    timerProgressBar: true,
                    ...SWAL_BASE_OPTIONS,
                });
            } else {
                await authAxios.post(API_EVENTS_PATH, finalRequestData);
                await Swal.fire({
                    icon: 'success',
                    title: '게시 완료',
                    text: '이벤트가 성공적으로 게시되었습니다.',
                    confirmButtonText: '확인',
                    timer: 2000,
                    timerProgressBar: true,
                    ...SWAL_BASE_OPTIONS,
                });
            }
            navigate('/host/dashboard');
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: '작업 실패',
                text: error.response?.data?.message || '이벤트 저장 중 오류가 발생했습니다.',
                confirmButtonText: '확인',
                ...SWAL_BASE_OPTIONS,
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isFetching) return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-gray-400 w-8 h-8"/>
      </div>
    );

    return (
        <div className="bg-gray-100 h-screen flex overflow-hidden font-[Pretendard]">
            {/* [왼쪽 패널] 에디터 */}
            <aside className="w-2/3 min-w-[600px] bg-white border-r border-gray-200 flex flex-col h-full">
                <div className="h-14 border-b border-gray-200 flex items-center px-6 justify-between shrink-0">
                    <h1 className="font-bold text-gray-900">{isEditMode ? '이벤트 수정' : '새 이벤트'}</h1>
                    <button onClick={() => navigate('/host/dashboard')} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* 1. 이미지 업로드 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-5 h-5 bg-gray-900 text-white rounded text-xs flex items-center justify-center font-medium">1</span>
                            <h2 className="text-sm font-semibold text-gray-900">대표 이미지</h2>
                            <span className="text-xs text-gray-400 ml-1">드래그하여 순서 변경</span>
                        </div>

                        <label className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors">
                            {isUploading ? (
                                <div className="text-gray-400 flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={18} />
                                    <span className="text-sm">업로드 중...</span>
                                </div>
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <Upload size={20} className="mb-1" />
                                    <span className="text-sm">클릭하여 이미지 추가</span>
                                    <span className="text-xs text-gray-300 mt-0.5">jpg, png, gif, webp</span>
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

                        {eventData.images.length > 0 && (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={eventData.images} strategy={rectSortingStrategy}>
                                    <div className="grid grid-cols-4 gap-3 mt-3">
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

                    {/* 2. 기본 정보 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-5 h-5 bg-gray-900 text-white rounded text-xs flex items-center justify-center font-medium">2</span>
                            <h2 className="text-sm font-semibold text-gray-900">기본 정보</h2>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">행사명</label>
                                <input type="text" name="title" value={eventData.title} onChange={handleChange} placeholder="예: 2024 경영학과 일일호프" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"/>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">행사 날짜</label>
                                    <input type="date" value={mainEventDate} onChange={(e) => setMainEventDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">장소</label>
                                    <input type="text" name="location" value={eventData.location} onChange={handleChange} placeholder="예: 서울 강남구 테헤란로" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 text-sm"/>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">설명</label>
                                <div data-color-mode="light" onPaste={onPaste} onDrop={onDrop}>
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
                                        height={300}
                                        preview="edit"
                                        textareaProps={{
                                            placeholder: '행사 내용을 입력하세요.'
                                        }}
                                        commands={[
                                            commands.bold, commands.italic, commands.strikethrough, commands.hr,
                                            commands.title, commands.divider,
                                            commands.link, commands.quote, commands.code,
                                            commands.divider,
                                            imageCustomCommand,
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. 일정 설정 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-5 h-5 bg-gray-900 text-white rounded text-xs flex items-center justify-center font-medium">3</span>
                            <h2 className="text-sm font-semibold text-gray-900">일정 설정</h2>
                        </div>
                        <div className="space-y-2">
                            {localSchedules.map((schedule, index) => (
                                <div key={index} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <input type="time" value={schedule.timeStart} onChange={(e) => handleScheduleTimeChange(index, 'timeStart', e.target.value)} className="bg-white border border-gray-200 px-2 py-1.5 rounded text-sm focus:outline-none focus:border-gray-900" />
                                    <span className="text-gray-400 text-sm">~</span>
                                    <input type="time" value={schedule.timeEnd} onChange={(e) => handleScheduleTimeChange(index, 'timeEnd', e.target.value)} className="bg-white border border-gray-200 px-2 py-1.5 rounded text-sm focus:outline-none focus:border-gray-900" />
                                    <div className="flex-1" />
                                    <span className="text-xs text-gray-500">정원</span>
                                    <input type="number" value={schedule.maxCapacity} onChange={(e) => handleCapacityChange(index, e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1.5 text-center text-sm focus:outline-none focus:border-gray-900" min="1"/>
                                    <button onClick={() => handleRemoveSchedule(index)} className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-gray-100 transition-colors"><Trash2 size={14}/></button>
                                </div>
                            ))}
                            <button onClick={handleAddSchedule} className="w-full py-2.5 border border-dashed border-gray-300 text-gray-500 rounded-lg text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-1">
                                <Plus size={16} /> 시간대 추가
                            </button>
                        </div>
                    </section>

                    {/* 4. 질문지 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-5 h-5 bg-gray-900 text-white rounded text-xs flex items-center justify-center font-medium">4</span>
                            <h2 className="text-sm font-semibold text-gray-900">신청 양식</h2>
                        </div>
                        <div className="space-y-2">
                            {eventData.questions.map((question, index) => (
                                <div key={index} className={`flex items-center gap-2 p-3 border rounded-lg ${question.isRequired ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
                                    <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                                    <input
                                        type="text"
                                        value={question.questionText}
                                        onChange={(e) => handleQuestionTextChange(index, e.target.value)}
                                        disabled={question.isRequired}
                                        placeholder="질문 내용"
                                        className={`flex-1 bg-transparent border-none outline-none text-sm ${question.isRequired ? 'text-gray-500' : 'text-gray-900'}`}
                                    />
                                    {question.isRequired && <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">필수</span>}
                                    {!question.isRequired && (
                                        <button onClick={() => handleRemoveQuestion(index)} className="text-gray-300 hover:text-red-500 p-1 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={handleAddQuestion} className="text-sm text-gray-500 hover:text-gray-900 py-2 flex items-center gap-1">
                                <Plus size={14} /> 질문 추가
                            </button>
                        </div>
                    </section>
                </div>

                <div className="p-4 border-t border-gray-200 flex gap-2 shrink-0 bg-white">
                    <button onClick={() => navigate('/host/dashboard')} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">취소</button>
                    <button onClick={handlePublish} disabled={isSaving || isUploading} className={`flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors ${(isSaving || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {(isSaving || isUploading) ? '처리 중...' : (isEditMode ? '수정 완료' : '게시하기')}
                    </button>
                </div>
            </aside>

            {/* [오른쪽 패널] 모바일 미리보기 */}
            <main className="w-1/3 bg-gray-200 flex items-center justify-center p-6">
                <div className="w-[320px] h-[640px] bg-white rounded-[2.5rem] border-[10px] border-gray-800 shadow-xl overflow-hidden relative flex flex-col">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-gray-800 rounded-b-xl z-30" />

                    {/* 주소창 */}
                    <div className="bg-white border-b border-gray-200 pt-8 pb-2 px-3">
                        <div className="bg-gray-100 rounded-lg py-1.5 px-3 text-[10px] text-gray-500 font-mono truncate">
                            {SERVICE_DOMAIN}/{isEditMode ? previewCode : 'ticket_code'}
                        </div>
                    </div>

                    {/* 컨텐츠 */}
                    <div className="flex-1 overflow-y-auto">
                        {/* 이미지 */}
                        <div className="h-44 bg-gray-100 relative">
                            {eventData.images.length > 0 ? (
                                <>
                                    <img src={eventData.images[0]} alt="대표" className="h-full w-full object-cover"/>
                                    {eventData.images.length > 1 && (
                                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                                            1 / {eventData.images.length}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                    <ImageIcon size={24} />
                                    <span className="text-[10px] mt-1">이미지 없음</span>
                                </div>
                            )}
                        </div>

                        {/* 정보 */}
                        <div className="p-4">
                            <h1 className="text-base font-bold text-gray-900 mb-2 leading-tight">{eventData.title || '행사 제목'}</h1>
                            <div className="text-[10px] text-gray-500 space-y-1 mb-4">
                                <div className="flex items-center gap-1">
                                    <Calendar size={10} />
                                    <span>{mainEventDate || '날짜 미정'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin size={10} />
                                    <span>{eventData.location || '장소 미정'}</span>
                                </div>
                            </div>

                            {eventData.description && (
                                <div className="mb-4 text-[10px] text-gray-500 border-l-2 border-gray-200 pl-2 line-clamp-3" data-color-mode="light">
                                    <MDEditor.Markdown
                                        source={eventData.description.substring(0, 100)}
                                        style={{ backgroundColor: 'white', color: '#6B7280', fontSize: '10px' }}
                                    />
                                </div>
                            )}

                            <p className="text-[10px] font-medium text-gray-700 mb-2">티켓 선택</p>
                            <div className="grid grid-cols-2 gap-1.5 mb-4">
                                {localSchedules.slice(0, 4).map((s, i) => (
                                    <div key={i} className="border border-gray-200 p-2 rounded-lg text-center">
                                        <div className="text-[10px] font-medium text-gray-900">{s.timeStart}</div>
                                        <div className="text-[8px] text-gray-400">잔여 {s.maxCapacity}</div>
                                    </div>
                                ))}
                            </div>

                            <p className="text-[10px] font-medium text-gray-700 mb-2">신청 정보</p>
                            <div className="space-y-1.5">
                                {eventData.questions.slice(0, 3).map((q, i) => (
                                    <div key={i} className="border border-gray-200 bg-gray-50 rounded-lg px-2 py-2">
                                        <div className="text-[8px] text-gray-400 mb-0.5">
                                            {q.questionText || '질문'} {q.isRequired && <span className="text-red-400">*</span>}
                                        </div>
                                        <div className="h-4 bg-white border border-gray-200 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 하단 버튼 */}
                    <div className="p-3 border-t border-gray-200 bg-white">
                        <div className="w-full bg-gray-900 text-white text-center py-2.5 rounded-lg text-xs font-medium">예매하기</div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HostEventCreatePage;
