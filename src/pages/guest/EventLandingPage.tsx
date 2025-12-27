import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import MDEditor from '@uiw/react-md-editor'; // 🔥 마크다운 뷰어 추가
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Lock,
  Home,
  AlertCircle,
  Search,
  Ticket,
  Info,
  Sparkles
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
import { IMAGE_CAROUSEL_INTERVAL_MS, PHONE_NUMBER_MIN_LENGTH, SWAL_COLORS } from '../../constants/ui';

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
  const [scrollY, setScrollY] = useState(0);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  // --- 유틸리티 함수 ---
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

  // --- 데이터 로딩 및 스크롤 ---
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
          if (error.response.status === 403) {
            setErrorType('PRIVATE');
          } else if (error.response.status === 404) {
            setErrorType('NOT_FOUND');
          } else {
            setErrorType('SERVER_ERROR');
          }
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
    const handleScroll = (): void => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 이미지 슬라이더 ---
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

  const nextImage = (): void => {
    if (event) {
      setCurrentImageIdx((prev) =>
        prev === event.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = (): void => {
    if (event) {
      setCurrentImageIdx((prev) =>
        prev === 0 ? event.images.length - 1 : prev - 1
      );
    }
  };

  // --- 핸들러: 내 예약 조회 ---
  const handleCheckReservation = async (): Promise<void> => {
    const defaultName = name;
    const defaultPhone = phone;

    const { value: formValues } = await Swal.fire({
      title: '🎟️ 내 예약 조회',
      html: `
        <div class="text-left text-sm text-gray-600 mb-4">예약 시 입력한 정보를 입력해주세요.</div>
        <input id="swal-input1" class="swal2-input !m-0 !mb-3 !w-full !h-12 !text-base" placeholder="이름 (예: 홍길동)" value="${defaultName}">
        <input id="swal-input2" class="swal2-input !m-0 !w-full !h-12 !text-base" placeholder="연락처 (예: 01012345678)" value="${defaultPhone}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '티켓 찾기',
      cancelButtonText: '닫기',
      confirmButtonColor: '#4f46e5',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3 font-bold',
        cancelButton: 'rounded-xl px-6 py-3 font-medium'
      },
      preConfirm: () => {
        const inputName = (document.getElementById('swal-input1') as HTMLInputElement).value;
        const inputPhone = (document.getElementById('swal-input2') as HTMLInputElement).value;
        if (!inputName || !inputPhone) {
          Swal.showValidationMessage('이름과 연락처를 모두 입력해주세요');
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

          await Swal.fire({
            icon: 'success',
            title: '티켓을 찾았습니다!',
            text: `${latestTicket.guestName}님의 티켓 페이지로 이동합니다.`,
            timer: 1500,
            showConfirmButton: false,
            confirmButtonColor: '#4f46e5',
          });

          navigate(`/ticket/${latestTicket.qrToken}`);
        } else {
          await Swal.fire({
            icon: 'error',
            title: '내역 없음',
            text: '일치하는 예매 내역이 없습니다. 정보를 다시 확인해주세요.',
            confirmButtonColor: '#4f46e5',
            customClass: { popup: 'rounded-2xl' }
          });
        }
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: '오류 발생',
          text: '서버와 통신 중 문제가 발생했습니다.',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'rounded-2xl' }
        });
      }
    }
  };

  // --- 핸들러: 예약 제출 ---
  const handleSubmit = async (): Promise<void> => {
    if (!selectedScheduleId) {
      await Swal.fire({
        icon: 'warning',
        title: '시간을 선택해주세요',
        text: '방문하실 회차를 선택해야 합니다.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' }
      });
      return;
    }

    if (!name.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: '이름을 입력해주세요',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' }
      });
      return;
    }

    if (phone.length < PHONE_NUMBER_MIN_LENGTH) {
      await Swal.fire({
        icon: 'warning',
        title: '연락처를 확인해주세요',
        text: '올바른 휴대폰 번호 형식이 아닙니다.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' }
      });
      return;
    }

    // 필수 질문 체크
    if (event) {
      const visibleQuestions = event.questions.filter(
        (q) => q.questionText !== '이름' && q.questionText !== '연락처'
      );

      for (const question of visibleQuestions) {
        if (question.isRequired && !answers[question.id]?.trim()) {
          await Swal.fire({
            icon: 'warning',
            title: '추가 정보를 입력해주세요',
            text: `'${question.questionText}' 항목은 필수입니다.`,
            confirmButtonColor: '#4f46e5',
            customClass: { popup: 'rounded-2xl' }
          });
          return;
        }
      }
    }

    const finalAnswers: Answer[] = [
      ...Object.entries(answers).map(([qId, text]) => ({
        questionId: Number(qId),
        answerText: text,
      })),
    ];

    if (event) {
      event.questions.forEach((q) => {
        if (q.questionText === '이름') {
          finalAnswers.push({ questionId: q.id, answerText: name });
        }
        if (q.questionText === '연락처') {
          finalAnswers.push({ questionId: q.id, answerText: phone });
        }
      });
    }

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

      await Swal.fire({
        icon: 'success',
        title: '🎉 예매 성공!',
        text: '티켓이 발급되었습니다.',
        confirmButtonColor: '#4f46e5',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });

      navigate(`/ticket/${qrToken}`);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        await Swal.fire({
          icon: 'error',
          title: '예매 실패',
          text: (error.response.data as { message?: string })?.message || '오류가 발생했습니다.',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'rounded-2xl' }
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: '통신 오류',
          text: '서버와 연결할 수 없습니다.',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'rounded-2xl' }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 렌더링: 로딩/에러 ---
  if (loading) {
    return (
      <div className="h-screen flex flex-col gap-4 items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
        <p className="text-gray-500 font-medium animate-pulse">이벤트 정보를 불러오고 있습니다...</p>
      </div>
    );
  }

  if (errorType === 'PRIVATE') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-[Pretendard] px-6">
        <div className="text-center mb-10 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-gray-200">
            <Lock className="text-gray-800 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">비공개 이벤트</h1>
          <p className="text-gray-500 leading-relaxed text-sm">
            초대받은 분들만 입장할 수 있는 이벤트입니다.<br />
            링크를 다시 한번 확인해주세요.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-lg px-5 py-3.5 font-bold transition-all shadow-sm active:scale-[0.98] flex justify-center items-center gap-2"
        >
          <Home size={20} /> 홈으로 이동
        </button>
      </div>
    );
  }

  if (errorType === 'NOT_FOUND' || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-[Pretendard] px-6">
        <div className="text-center mb-10 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-6">
            <AlertCircle className="text-red-400 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">존재하지 않는 이벤트</h1>
          <p className="text-gray-500 leading-relaxed text-sm">
            이벤트가 종료되었거나 삭제되었습니다.<br />
            주소를 다시 확인해주세요.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-lg px-5 py-3.5 font-bold transition-all shadow-sm active:scale-[0.98] flex justify-center items-center gap-2"
        >
          <Home size={18} /> 홈으로 이동
        </button>
      </div>
    );
  }

  // --- 메인 렌더링 ---
  return (
    <div className="min-h-screen bg-gray-100 font-[Pretendard] flex justify-center items-start pt-0 sm:pt-10 pb-0 sm:pb-10">
      
      {/* 모바일 컨테이너 */}
      <div className="w-full max-w-[480px] min-h-screen sm:min-h-[800px] sm:rounded-[2.5rem] shadow-2xl relative bg-white overflow-hidden flex flex-col">
        
        {/* 1. 상단 히어로 이미지 영역 (패럴랙스 효과) */}
        <div className="relative h-[420px] shrink-0 overflow-hidden bg-gray-900">
           {/* 이미지 슬라이더 */}
           {event.images.length > 0 ? (
            <div 
                className="absolute inset-0 w-full h-full transition-transform duration-100"
                style={{ transform: `translateY(${scrollY * 0.4}px)` }} // 패럴랙스
            >
              {event.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === currentImageIdx ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img src={img} alt="Event Cover" className="w-full h-full object-cover" />
                  {/* 그라데이션 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
               <Ticket size={48} className="opacity-20"/>
            </div>
          )}

          {/* 상단 네비게이션 */}
          <div className="absolute top-0 left-0 w-full p-4 z-50 flex justify-between items-center">
             <button 
                onClick={() => navigate('/')}
                className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
             >
                <ChevronLeft size={24} />
             </button>
             {/* 페이지네이션 닷 */}
             {event.images.length > 1 && (
                <div className="flex gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    {event.images.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImageIdx ? 'bg-white w-4' : 'bg-white/50'}`} />
                    ))}
                </div>
             )}
          </div>
        </div>

        {/* 2. 컨텐츠 바디 (라운드 처리로 이미지 위로 올라오게) */}
        <div className="relative -mt-10 z-10 bg-white rounded-t-[2rem] px-6 pt-2 pb-32 flex-1 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          {/* 드래그 핸들 데코레이션 */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4 mb-8"></div>

          {/* 타이틀 섹션 */}
          <div className="mb-10">
            <div className="flex gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold">
                    <Sparkles size={12} /> 추천 이벤트
                </span>
            </div>
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight break-keep mb-5">
              {event.title}
            </h1>
            
            <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                     <Calendar size={16} />
                  </div>
                  <div>
                     <p className="text-xs text-gray-400 font-bold mb-0.5">DATE</p>
                     <p className="text-sm font-semibold text-gray-800">
                        {event.schedules.length > 0 ? formatDate(event.schedules[0].startTime) : '날짜 미정'}
                     </p>
                  </div>
               </div>
               <div className="w-full h-px bg-gray-200/50"></div>
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                     <MapPin size={16} />
                  </div>
                  <div>
                     <p className="text-xs text-gray-400 font-bold mb-0.5">LOCATION</p>
                     <p className="text-sm font-semibold text-gray-800 break-all">{event.location}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* 상세 설명 (마크다운) */}
          <section className="mb-12">
            <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                <Info size={18} className="text-gray-400" /> 상세 정보
            </h3>
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed bg-white" data-color-mode="light">
              <MDEditor.Markdown 
                source={event.description} 
                style={{ backgroundColor: 'white', color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.7' }} 
              />
            </div>
          </section>

          {/* 시간 선택 */}
          <section className="mb-12">
            <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                <Clock size={18} className="text-gray-400" /> 시간 선택
            </h3>
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
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 group
                      ${isSoldOut 
                        ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' 
                        : isSelected
                            ? 'bg-indigo-50 border-indigo-600 shadow-md ring-0'
                            : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-lg font-bold ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {formatTime(schedule.startTime)}
                        </span>
                        {isSelected && <CheckCircle size={20} className="text-indigo-600 fill-indigo-100" />}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                        {isSoldOut ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-600">매진</span>
                        ) : (
                            <span className={`${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                                잔여 <span className="font-bold">{remaining}</span>석
                            </span>
                        )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 예매자 정보 입력 */}
          <section className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                <User size={18} className="text-gray-400" /> 예매자 정보
            </h3>
            <div className="space-y-4">
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">이름</label>
                <div className="relative">
                    <User className="absolute left-4 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="실명을 입력해주세요"
                        className="w-full bg-gray-50 border border-transparent rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-gray-400"
                    />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">연락처</label>
                <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="010-0000-0000"
                        maxLength={13}
                        className="w-full bg-gray-50 border border-transparent rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-gray-400"
                    />
                </div>
              </div>

              {/* 추가 질문 */}
              {event.questions
                .filter((q) => q.questionText !== '이름' && q.questionText !== '연락처')
                .map((q) => (
                  <div key={q.id} className="group pt-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">
                      {q.questionText} {q.isRequired && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-gray-400"
                      placeholder="답변을 입력해주세요"
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  </div>
                ))}
            </div>
          </section>
        </div>

        {/* 3. 하단 고정 액션 바 */}
        <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-100 p-4 pb-6 z-50 safe-area-pb">
            <div className="flex gap-3">
                <button
                    onClick={handleCheckReservation}
                    className="flex flex-col items-center justify-center px-4 py-2 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors active:scale-95 shadow-sm"
                >
                    <Search size={20} className="mb-0.5 text-gray-800" />
                    <span className="text-[10px] font-bold">조회</span>
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !selectedScheduleId}
                    className={`flex-1 relative overflow-hidden font-bold text-lg py-3.5 rounded-2xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2
                        ${isSubmitting || !selectedScheduleId
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                        }
                    `}
                >
                    {isSubmitting && <Loader2 className="animate-spin w-5 h-5 absolute left-6" />}
                    <span>
                        {isSubmitting ? '처리 중...' : selectedScheduleId ? '예매하기' : '시간을 선택해주세요'}
                    </span>
                    {!isSubmitting && selectedScheduleId && <ChevronRight size={20} className="opacity-50" />}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default GuestEventPage;