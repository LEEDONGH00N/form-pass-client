import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import Swal from 'sweetalert2';
import { RefreshCw, Ticket, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();

  // 입력 데이터 상태
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  // 진행 단계 상태 (INPUT: 이메일입력, VERIFY: 인증중, COMPLETE: 인증완료)
  const [step, setStep] = useState<'INPUT' | 'VERIFY' | 'COMPLETE'>('INPUT');

  // 타이머 관련 상태
  const [timeLeft, setTimeLeft] = useState(300); // 5분 = 300초
  const [isTimerActive, setIsTimerActive] = useState(false);

  // 타이머 로직
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  // 시간 포맷팅 (05:00)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 약관 전문 보기 모달
  const handleOpenPrivacyPolicy = () => {
    Swal.fire({
      title: '개인정보 수집 및 이용 동의',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #374151;">
          <p><strong>1. 수집 및 이용 목적</strong><br/>회원 가입 의사 확인, 회원 식별, 서비스 제공(행사 개설 및 관리)</p>
          <br/>
          <p><strong>2. 수집하는 개인정보 항목</strong><br/>아이디(이메일), 비밀번호, 이름</p>
          <br/>
          <p><strong>3. 보유 및 이용 기간</strong><br/><strong>회원 탈퇴 시까지</strong> (단, 관계 법령에 따라 보존이 필요한 경우 해당 기간까지 보관)</p>
          <br/>
          <p><strong>4. 동의 거부 권리</strong><br/>귀하는 개인정보 수집 및 이용에 거부할 권리가 있으나, 동의를 거부할 경우 회원가입이 불가능합니다.</p>
        </div>
      `,
      confirmButtonText: '확인',
      confirmButtonColor: '#3B82F6',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-2 font-bold'
      }
    });
  };

  // 1. 이메일 인증코드 전송
  const handleSendEmail = async () => {
    if (!email) {
      await Swal.fire({ icon: 'warning', text: '이메일을 입력해주세요.', confirmButtonColor: '#3B82F6' });
      return;
    }
    try {
      await authApi.sendEmail({ email });
      setStep('VERIFY');
      setIsTimerActive(true);
      setTimeLeft(300); // 5분 리셋
      await Swal.fire({
        icon: 'success',
        title: '발송 완료',
        text: '인증 메일이 발송되었습니다!',
        confirmButtonColor: '#3B82F6',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      await Swal.fire({ icon: 'error', text: '메일 발송 실패. 서버 상태를 확인해주세요.', confirmButtonColor: '#3B82F6' });
    }
  };

  // 이메일 재전송 핸들러
  const handleResendEmail = async () => {
    try {
      await authApi.sendEmail({ email });
      setCode(''); // 코드 초기화
      setIsTimerActive(true);
      setTimeLeft(300);
      Swal.fire({
        icon: 'success',
        title: '재전송 완료',
        text: '인증번호를 다시 보냈습니다.',
        confirmButtonColor: '#3B82F6',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire({ icon: 'error', text: '재전송 실패. 잠시 후 다시 시도해주세요.', confirmButtonColor: '#3B82F6' });
    }
  };

  // 2. 인증코드 검증
  const handleVerify = async () => {
    try {
      await authApi.verifyEmail({ email, authCode: code });
      setIsTimerActive(false);
      setStep('COMPLETE');
      await Swal.fire({
        icon: 'success',
        title: '인증 성공',
        text: '나머지 정보를 입력해주세요.',
        confirmButtonColor: '#3B82F6',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      await Swal.fire({ icon: 'error', text: '인증 코드가 올바르지 않거나 만료되었습니다.', confirmButtonColor: '#3B82F6' });
    }
  };

  // 3. 최종 회원가입
  const handleSignup = async () => {
    if (!name || !password) {
      await Swal.fire({ icon: 'warning', text: '모든 정보를 입력해주세요.', confirmButtonColor: '#3B82F6' });
      return;
    }

    // 동의 여부 체크
    if (!isAgreed) {
      await Swal.fire({ icon: 'warning', text: '약관에 동의해주세요.', confirmButtonColor: '#3B82F6' });
      return;
    }

    try {
      await authApi.signup({ email, name, password });
      await Swal.fire({
        icon: 'success',
        title: '회원가입 완료',
        text: '로그인 페이지로 이동합니다.',
        confirmButtonColor: '#3B82F6'
      });
      navigate('/login');
    } catch (e) {
      console.error(e);
      await Swal.fire({ icon: 'error', text: '가입 실패. 이미 존재하는 회원이거나 오류가 발생했습니다.', confirmButtonColor: '#3B82F6' });
    }
  };

  // 스텝 인디케이터 컴포넌트
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {/* Step 1 */}
      <div className={`flex items-center gap-2 ${step === 'INPUT' ? 'opacity-100' : 'opacity-50'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          step === 'INPUT' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md' : 'bg-blue-100 text-blue-600'
        }`}>
          {step === 'INPUT' ? '1' : <CheckCircle2 size={16} />}
        </div>
        <span className="text-xs font-medium text-gray-500 hidden sm:block">이메일</span>
      </div>

      <div className={`w-8 h-px ${step !== 'INPUT' ? 'bg-blue-300' : 'bg-gray-200'}`} />

      {/* Step 2 */}
      <div className={`flex items-center gap-2 ${step === 'VERIFY' ? 'opacity-100' : step === 'INPUT' ? 'opacity-40' : 'opacity-50'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          step === 'VERIFY' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md' :
          step === 'COMPLETE' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
        }`}>
          {step === 'COMPLETE' ? <CheckCircle2 size={16} /> : '2'}
        </div>
        <span className="text-xs font-medium text-gray-500 hidden sm:block">인증</span>
      </div>

      <div className={`w-8 h-px ${step === 'COMPLETE' ? 'bg-blue-300' : 'bg-gray-200'}`} />

      {/* Step 3 */}
      <div className={`flex items-center gap-2 ${step === 'COMPLETE' ? 'opacity-100' : 'opacity-40'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          step === 'COMPLETE' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'
        }`}>
          3
        </div>
        <span className="text-xs font-medium text-gray-500 hidden sm:block">완료</span>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 py-8 font-[Pretendard] relative overflow-hidden">

      {/* 배경 장식 요소 */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-20 -right-32 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      <div className="relative bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl shadow-blue-100/50 w-full max-w-md border border-white/50 animate-fade-in-up">

        {/* 로고 아이콘 박스 */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
          <Ticket className="w-7 h-7 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">회원가입</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Form PASS와 함께 이벤트를 관리하세요</p>

        {/* 스텝 인디케이터 */}
        <StepIndicator />

        <div className="space-y-5">

          {/* 1단계: 이메일 입력 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">이메일</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={step !== 'INPUT'}
                className="flex-1 p-3.5 bg-gray-50/50 border border-gray-200/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                placeholder="example@email.com"
              />
              {step === 'INPUT' && (
                <button
                  onClick={handleSendEmail}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  전송
                </button>
              )}
            </div>
          </div>

          {/* 2단계: 인증번호 입력 (메일 전송 후 표시) */}
          {step === 'VERIFY' && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-100 animate-fade-in-up shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-blue-700">인증번호 입력</label>
                <span className={`font-bold text-sm ${timeLeft < 60 ? 'text-red-500' : 'text-blue-600'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="flex gap-2 items-center mb-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 p-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
                <button
                  onClick={handleVerify}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98] whitespace-nowrap"
                >
                  확인
                </button>
              </div>

              {/* 재전송 버튼 */}
              <div className="flex justify-between items-center text-xs px-1">
                <p className="text-blue-400">* 이메일을 확인해주세요.</p>
                <button
                  onClick={handleResendEmail}
                  className="flex items-center gap-1 text-gray-500 hover:text-blue-600 font-semibold underline transition-colors"
                >
                  <RefreshCw size={12} /> 인증번호 재전송
                </button>
              </div>
            </div>
          )}

          {/* 인증 완료 메시지 */}
          {step === 'COMPLETE' && (
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-sm bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-inner">
              <CheckCircle2 size={18} />
              <span>이메일 인증이 완료되었습니다.</span>
            </div>
          )}

          <hr className="border-gray-100" />

          {/* 3단계: 회원 정보 입력 (인증 완료 시 활성화) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={step !== 'COMPLETE'}
              className="w-full p-3.5 bg-gray-50/50 border border-gray-200/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-200"
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={step !== 'COMPLETE'}
              className="w-full p-3.5 bg-gray-50/50 border border-gray-200/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-200"
              placeholder="비밀번호 입력"
            />
          </div>

          {/* 개인정보 수집 동의 체크박스 */}
          <div className="pt-1">
            <div
              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                step === 'COMPLETE'
                  ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-inner'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  disabled={step !== 'COMPLETE'}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:bg-gray-200 cursor-pointer accent-blue-600"
                />
                <span
                  className={`font-bold text-sm ${
                    step === 'COMPLETE' ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  [필수] 개인정보 수집 및 이용 동의
                </span>
              </label>

              {/* 약관 보기 버튼 */}
              <button
                type="button"
                onClick={handleOpenPrivacyPolicy}
                className="text-xs text-gray-500 underline hover:text-blue-600 transition-colors ml-2 whitespace-nowrap"
              >
                약관 보기
              </button>
            </div>
          </div>

          <button
            onClick={handleSignup}
            disabled={step !== 'COMPLETE' || !isAgreed}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 hover:-translate-y-0.5 active:scale-[0.98] disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
          >
            가입하기
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          이미 회원이신가요?
          <Link to="/login" className="text-blue-600 font-bold ml-2 hover:underline hover:text-blue-700 transition-colors">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
