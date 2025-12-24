import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
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

  useEffect(() => {
    const loadEvent = async (): Promise<void> => {
      if (!eventCode) return;

      try {
        setLoading(true);
        const accessToken = localStorage.getItem('accessToken');
        const eventData = await fetchEventDetails({ eventCode, accessToken });
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

  const handleCheckReservation = async (): Promise<void> => {
    const defaultName = name;
    const defaultPhone = phone;

    const { value: formValues } = await Swal.fire({
      title: '내 예약 조회',
      html:
        `<input id="swal-input1" class="swal2-input" placeholder="예약자 이름" value="${defaultName}">` +
        `<input id="swal-input2" class="swal2-input" placeholder="연락처 (숫자만 입력)" value="${defaultPhone}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '조회하기',
      cancelButtonText: '취소',
      confirmButtonColor: SWAL_COLORS.CONFIRM_BUTTON,
      preConfirm: () => {
        const inputName = (
          document.getElementById('swal-input1') as HTMLInputElement
        ).value;
        const inputPhone = (
          document.getElementById('swal-input2') as HTMLInputElement
        ).value;
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
            title: '예약 확인됨',
            text: `${latestTicket.guestName}님의 티켓으로 이동합니다.`,
            timer: 1500,
            showConfirmButton: false,
          });

          navigate(`/ticket/${latestTicket.qrToken}`);
        } else {
          await Swal.fire({
            icon: 'error',
            title: '조회 실패',
            text: '일치하는 예매 내역이 없습니다.',
            confirmButtonColor: SWAL_COLORS.CONFIRM_BUTTON,
          });
        }
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: '오류 발생',
          text: '예약 정보를 찾을 수 없거나 서버 오류입니다.',
          confirmButtonColor: SWAL_COLORS.CONFIRM_BUTTON,
        });
      }
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedScheduleId) {
      await Swal.fire({
        icon: 'warning',
        title: '시간 선택 필요',
        text: '방문할 시간을 선택해주세요.',
        confirmButtonColor: SWAL_COLORS.CONFIRM_BUTTON,
      });
      return;
    }

    if (!name.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: '이름 입력 필요',
        text: '예약자 이름을 입력해주세요.',
        confirmButtonColor: SWAL_COLORS.CONFIRM_BUTTON,
      });
      return;
    }

    if (phone.length < PHONE_NUMBER_MIN_LENGTH) {
      await Swal.fire({
        icon: 'warning',
        title: '연락처 확인',
        text: '올바른 휴대폰 번호를 입력해주세요.',
        confirmButtonColor: SWAL_COLORS.CONFIRM_BUTTON,
      });
      return;
    }

    if (event) {
      const visibleQuestions = event.questions.filter(
        (q) => q.questionText !== '이름' && q.questionText !== '연락처'
      );

      for (const question of visibleQuestions) {
        if (question.isRequired && !answers[question.id]?.trim()) {
          await Swal.fire({
            icon: 'warning',
            title: '입력 필요',
            text: `'${question.questionText}' 항목을 입력해주세요.`,
            confirmButtonColor: SWAL_COLORS.CONFIRM_BUTTON,
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
        title: '예약 완료',
        text: '예약이 확정되었습니다!',
        confirmButtonColor: SWAL_COLORS.CONFIRM_BUTTON,
      });

      navigate(`/ticket/${qrToken}`);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        await Swal.fire({
          icon: 'error',
          title: '예약 실패',
          text: (error.response.data as { message?: string })?.message || '오류가 발생했습니다.',
          confirmButtonColor: SWAL_COLORS.CONFIRM_BUTTON,
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: '통신 오류',
          text: '서버와 통신 중 오류가 발생했습니다.',
          confirmButtonColor: SWAL_COLORS.CONFIRM_BUTTON,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  }

  if (errorType === 'PRIVATE') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-[Pretendard] px-6">
        <div className="text-center mb-10 animate-in fade-in duration-700">
          <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-gray-100">
            <Lock className="text-indigo-500 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            비공개 이벤트입니다
          </h1>
          <p className="text-gray-500 leading-relaxed text-sm">
            이 이벤트는 호스트의 초대가 필요합니다.
            <br />
            공유받은 링크가 정확한지 다시 확인해주세요.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-lg px-5 py-3.5 font-bold transition-all shadow-sm active:scale-[0.98] flex justify-center items-center gap-2"
        >
          <Home size={20} />
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  if (errorType === 'NOT_FOUND' || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-[Pretendard] px-6">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-6">
            <AlertCircle className="text-red-400 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            이벤트를 찾을 수 없습니다
          </h1>
          <p className="text-gray-500 leading-relaxed text-sm">
            입력하신 주소가 정확한지 확인해주세요.
            <br />
            이벤트가 종료되었거나 삭제되었을 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-lg px-5 py-3.5 font-bold transition-all shadow-sm active:scale-[0.98] flex justify-center items-center gap-2"
        >
          <Home size={18} /> 메인으로
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-[Pretendard] flex justify-center">
      <div className="w-full max-w-[480px] min-h-screen shadow-xl relative bg-white">
        <div
          className="fixed top-0 w-full max-w-[480px] h-[520px] z-0 overflow-hidden"
          style={{
            transform:
              scrollY < 0
                ? `scale(${1 + Math.abs(scrollY) * 0.002})`
                : `translateY(${scrollY * 0.5}px)`,
          }}
        >
          {event.images.length > 0 ? (
            <div className="relative w-full h-full">
              {event.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === currentImageIdx ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={img}
                    alt="event"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/40 to-transparent"></div>
                </div>
              ))}
              {event.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white"
                  >
                    <ChevronLeft size={36} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white"
                  >
                    <ChevronRight size={36} />
                  </button>
                  <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-10">
                    {event.images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === currentImageIdx
                            ? 'w-6 bg-white'
                            : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
              이미지 없음
            </div>
          )}
        </div>

        <div className="fixed top-0 z-50 w-full max-w-[480px] p-4 flex justify-between items-start pointer-events-none">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-white/40"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="relative z-10 mt-[480px] bg-white rounded-t-[2rem] min-h-[800px] px-6 pt-10 pb-32 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full"></div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-snug break-keep">
              {event.title}
            </h1>
            <div className="space-y-2 text-sm text-gray-600">
              {event.schedules.length > 0 && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>{formatDate(event.schedules[0].startTime)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 mb-8"></div>

          <div className="mb-12">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">상세 내용</h3>
            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {event.description}
            </div>
          </div>

          <section className="mb-10">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">시간 선택</h3>
            <div className="grid grid-cols-2 gap-3">
              {event.schedules.map((schedule) => {
                const remaining = schedule.maxCapacity - schedule.reservedCount;
                const isSoldOut = remaining <= 0;

                return (
                  <button
                    key={schedule.id}
                    onClick={() => !isSoldOut && setSelectedScheduleId(schedule.id)}
                    disabled={isSoldOut}
                    className={`p-4 rounded-xl border transition-all text-left relative group
                      ${
                        isSoldOut
                          ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                          : selectedScheduleId === schedule.id
                          ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div
                      className={`font-bold text-base mb-1 ${
                        isSoldOut
                          ? 'text-gray-400 decoration-slate-400'
                          : selectedScheduleId === schedule.id
                          ? 'text-indigo-700'
                          : 'text-gray-800'
                      }`}
                    >
                      {formatTime(schedule.startTime)}
                      {isSoldOut && (
                        <span className="ml-2 text-red-500 text-xs font-black">
                          매진
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      <span>
                        {isSoldOut ? '예약 마감' : `잔여 ${remaining}명`}
                      </span>
                    </div>

                    {!isSoldOut && selectedScheduleId === schedule.id && (
                      <div className="absolute top-3 right-3 text-indigo-600">
                        <CheckCircle
                          size={18}
                          fill="currentColor"
                          className="text-white"
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">
              예매자 정보
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition"
                  />
                </div>
              </div>
              {event.questions
                .filter(
                  (q) => q.questionText !== '이름' && q.questionText !== '연락처'
                )
                .map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {q.questionText}{' '}
                      {q.isRequired && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition"
                      placeholder={`${q.questionText}을(를) 입력해주세요`}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                    />
                  </div>
                ))}
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-area-pb z-50">
          <div className="flex gap-3">
            <button
              onClick={handleCheckReservation}
              className="flex flex-col items-center justify-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors active:scale-95"
              title="내 예약 조회"
            >
              <Search size={20} className="mb-0.5" />
              <span className="text-[10px] font-bold">내 예약</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedScheduleId}
              className={`flex-1 font-bold text-lg py-3 rounded-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2
                ${
                  isSubmitting || !selectedScheduleId
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  예약 처리 중...
                </>
              ) : selectedScheduleId ? (
                '예매하기'
              ) : (
                '시간을 선택해주세요'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestEventPage;
