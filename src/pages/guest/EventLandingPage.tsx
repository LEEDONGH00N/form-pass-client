import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { showSuccess, showError, showWarning, SWAL_BASE_OPTIONS } from '../../constants/swalTheme';
import Swal from 'sweetalert2';
import {
  MapPin,
  Calendar,
  Clock,
  Check,
  Loader2,
  ChevronLeft,
  User,
  Lock,
  AlertCircle,
  Search,
  ImageIcon,
  Ticket,
} from 'lucide-react';
import {
  EventDetail,
  ErrorType,
  ReservationRequest,
  Answer,
} from '../../types/event';
import {
  fetchEventDetails,
  createReservation,
  lookupReservations,
  isAxiosError,
} from '../../api/eventApi';
import { IMAGE_CAROUSEL_INTERVAL_MS, PHONE_NUMBER_MIN_LENGTH } from '../../constants/ui';

const GuestEventPage: React.FC = () => {
  const { eventCode } = useParams<{ eventCode: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>('NONE');

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setPhone(formatted);
  };

  useEffect(() => {
    const loadEvent = async (): Promise<void> => {
      if (!eventCode) return;
      try {
        setLoading(true);
        const eventData = await fetchEventDetails({ eventCode });
        setEvent(eventData);
        setErrorType('NONE');
      } catch (error) {
        if (isAxiosError(error) && error.response) {
          if (error.response.status === 403) setErrorType('PRIVATE');
          else if (error.response.status === 404) setErrorType('NOT_FOUND');
          else setErrorType('SERVER_ERROR');
        } else {
          setErrorType('SERVER_ERROR');
        }
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [eventCode]);

  useEffect(() => {
    if (event && event.images.length > 1) {
      autoSlideRef.current = setTimeout(() => {
        setCurrentImageIdx((prev) =>
          prev === event.images.length - 1 ? 0 : prev + 1
        );
      }, IMAGE_CAROUSEL_INTERVAL_MS);
    }
    return () => {
      if (autoSlideRef.current) clearTimeout(autoSlideRef.current);
    };
  }, [currentImageIdx, event]);

  const handleCheckReservation = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      ...SWAL_BASE_OPTIONS,
      title: '예약 조회',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
            <input id="swal-input1" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" placeholder="홍길동" value="${name}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">연락처</label>
            <input id="swal-input2" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" placeholder="01012345678" value="${phone}">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '조회',
      cancelButtonText: '취소',
      preConfirm: () => {
        const inputName = (document.getElementById('swal-input1') as HTMLInputElement).value;
        const inputPhone = (document.getElementById('swal-input2') as HTMLInputElement).value;
        if (!inputName || !inputPhone) {
          Swal.showValidationMessage('이름과 연락처를 입력해주세요');
        }
        return [inputName, inputPhone];
      },
    });

    if (formValues) {
      const [inputName, inputPhone] = formValues;
      try {
        const reservations = await lookupReservations({
          guestName: inputName,
          guestPhoneNumber: inputPhone.replace(/-/g, ''),
        });
        if (Array.isArray(reservations) && reservations.length > 0) {
          const latestTicket = reservations[0];
          localStorage.setItem('guest_token', latestTicket.qrToken);
          await showSuccess('예약을 찾았습니다', '티켓 페이지로 이동합니다.');
          navigate(`/ticket/${latestTicket.qrToken}`);
        } else {
          await showError('예약 없음', '일치하는 예약이 없습니다.');
        }
      } catch {
        await showError('오류', '서버 오류가 발생했습니다.');
      }
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedScheduleId) {
      await showWarning('시간 선택', '시간을 선택해주세요.');
      return;
    }
    if (!name.trim()) {
      await showWarning('이름 입력', '이름을 입력해주세요.');
      return;
    }
    if (phone.length < PHONE_NUMBER_MIN_LENGTH) {
      await showWarning('연락처 확인', '올바른 연락처를 입력해주세요.');
      return;
    }

    if (event) {
      const visibleQuestions = event.questions.filter(
        (q) => q.questionText !== '이름' && q.questionText !== '연락처'
      );
      for (const question of visibleQuestions) {
        if (question.isRequired && !answers[question.id]?.trim()) {
          await showWarning('필수 항목', `'${question.questionText}'을(를) 입력해주세요.`);
          return;
        }
      }
    }

    const finalAnswers: Answer[] = Object.entries(answers).map(([qId, text]) => ({
      questionId: Number(qId),
      answerText: text,
    }));

    const requestData: ReservationRequest = {
      scheduleId: selectedScheduleId,
      guestName: name,
      guestPhoneNumber: phone.replace(/-/g, ''),
      ticketCount: 1,
      answers: finalAnswers,
    };

    try {
      setIsSubmitting(true);
      const response = await createReservation(requestData);
      const { qrToken } = response;
      localStorage.setItem('guest_token', qrToken);
      await showSuccess('예매 완료', '티켓이 발급되었습니다.');
      navigate(`/ticket/${qrToken}`);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        await showError('예매 실패', (error.response.data as { message?: string })?.message || '오류가 발생했습니다.');
      } else {
        await showError('오류', '서버와 연결할 수 없습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  // 비공개
  if (errorType === 'PRIVATE') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col justify-center items-center px-6 font-[Pretendard]">
        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="text-blue-500 w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">비공개 이벤트</h1>
        <p className="text-gray-500 text-center mb-8">
          초대받은 분들만 접근할 수 있습니다.
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 font-semibold hover:underline"
        >
          ← 홈으로 돌아가기
        </button>
      </div>
    );
  }

  // 404
  if (errorType === 'NOT_FOUND' || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col justify-center items-center px-6 font-[Pretendard]">
        <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="text-red-500 w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">이벤트를 찾을 수 없습니다</h1>
        <p className="text-gray-500 text-center mb-8">
          삭제되었거나 주소가 잘못되었습니다.
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 font-semibold hover:underline"
        >
          ← 홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[Pretendard]">
      {/* 모바일 컨테이너 */}
      <div className="max-w-lg mx-auto bg-white min-h-screen shadow-xl">

        {/* 이미지 영역 */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-50">
          {event.images.length > 0 ? (
            <>
              <img
                src={event.images[currentImageIdx]}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              {event.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {event.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIdx(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === currentImageIdx ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-blue-200" />
            </div>
          )}

          {/* 뒤로가기 */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="px-6 py-8">
          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-5 break-keep leading-tight">
            {event.title}
          </h1>

          {/* 일시/장소 */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar size={18} className="text-blue-500" />
              </div>
              <span className="text-gray-700">
                {event.schedules.length > 0 ? formatDate(event.schedules[0].startTime) : '날짜 미정'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <MapPin size={18} className="text-blue-500" />
              </div>
              <span className="text-gray-700">{event.location || '장소 미정'}</span>
            </div>
          </div>

          {/* 설명 */}
          {event.description && (
            <div className="mb-10 pb-8 border-b border-gray-100">
              <div className="prose prose-sm max-w-none text-gray-600" data-color-mode="light">
                <MDEditor.Markdown
                  source={event.description}
                  style={{ backgroundColor: 'transparent', color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.8' }}
                />
              </div>
            </div>
          )}

          {/* 시간 선택 */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              시간 선택
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {event.schedules.map((schedule) => {
                const remaining = schedule.maxCapacity - schedule.reservedCount;
                const isSoldOut = remaining <= 0;
                const isSelected = selectedScheduleId === schedule.id;

                return (
                  <button
                    key={schedule.id}
                    onClick={() => !isSoldOut && setSelectedScheduleId(schedule.id)}
                    disabled={isSoldOut}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      isSoldOut
                        ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                        {formatTime(schedule.startTime)}
                      </span>
                      {isSelected && <Check size={18} className="text-blue-500" />}
                    </div>
                    <span className={`text-sm ${isSoldOut ? 'text-gray-400' : isSelected ? 'text-blue-500' : 'text-gray-500'}`}>
                      {isSoldOut ? '매진' : `${remaining}석 남음`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 예매자 정보 */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-500" />
              예매자 정보
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  maxLength={13}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              {/* 추가 질문 */}
              {event.questions
                .filter((q) => q.questionText !== '이름' && q.questionText !== '연락처')
                .map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {q.questionText}
                      {q.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="입력해주세요"
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* 하단 고정 버튼 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-6">
          <div className="flex gap-3">
            <button
              onClick={handleCheckReservation}
              className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
            >
              <Search size={22} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedScheduleId}
              className={`flex-1 h-14 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                isSubmitting || !selectedScheduleId
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <Ticket size={20} />
                  {selectedScheduleId ? '예매하기' : '시간을 선택하세요'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestEventPage;
