import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { showSuccess, showError, showWarning, showCustomModal } from '../constants/swalTheme';
import { Loader2, Check, RefreshCw, Zap, Mail, Lock, User } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  const [step, setStep] = useState<'INPUT' | 'VERIFY' | 'COMPLETE'>('INPUT');
  const [timeLeft, setTimeLeft] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleOpenPrivacyPolicy = () => {
    showCustomModal({
      title: '개인정보 수집 동의',
      html: `
        <div class="text-left text-sm text-gray-600 space-y-4">
          <div>
            <p class="font-semibold text-gray-800 mb-1">1. 수집 목적</p>
            <p>회원 식별, 서비스 제공</p>
          </div>
          <div>
            <p class="font-semibold text-gray-800 mb-1">2. 수집 항목</p>
            <p>이메일, 비밀번호, 이름</p>
          </div>
          <div>
            <p class="font-semibold text-gray-800 mb-1">3. 보유 기간</p>
            <p>회원 탈퇴 시까지</p>
          </div>
        </div>
      `,
      confirmButtonText: '확인',
    });
  };

  const handleSendEmail = async () => {
    if (!email) {
      await showWarning('이메일 입력', '이메일을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.sendEmail({ email });
      setStep('VERIFY');
      setIsTimerActive(true);
      setTimeLeft(300);
      await showSuccess('발송 완료', '인증 메일을 확인해주세요.');
    } catch {
      await showError('발송 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      await authApi.sendEmail({ email });
      setCode('');
      setTimeLeft(300);
      setIsTimerActive(true);
      await showSuccess('재발송 완료', '인증 메일을 확인해주세요.');
    } catch {
      await showError('발송 실패', '잠시 후 다시 시도해주세요.');
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      await authApi.verifyEmail({ email, authCode: code });
      setIsTimerActive(false);
      setStep('COMPLETE');
      await showSuccess('인증 완료', '나머지 정보를 입력해주세요.');
    } catch {
      await showError('인증 실패', '코드가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !password) {
      await showWarning('정보 입력', '모든 정보를 입력해주세요.');
      return;
    }
    if (!isAgreed) {
      await showWarning('동의 필요', '개인정보 수집에 동의해주세요.');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.signup({ email, name, password });
      await showSuccess('가입 완료', '로그인해주세요.');
      navigate('/login');
    } catch {
      await showError('가입 실패', '이미 가입된 이메일입니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepNum = step === 'INPUT' ? 1 : step === 'VERIFY' ? 2 : 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4 py-12 font-[Pretendard]">
      {/* 배경 장식 */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative">
        {/* 로고 */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-gray-500">Form PASS 계정을 만들어보세요</p>
        </div>

        {/* 단계 표시 */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {['이메일', '인증', '완료'].map((label, i) => {
            const num = i + 1;
            const isActive = num <= stepNum;
            const isComplete = num < stepNum;

            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isComplete ? <Check size={18} /> : num}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < 2 && (
                  <div className={`w-12 h-1 rounded-full -mt-5 ${num < stepNum ? 'bg-blue-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 폼 카드 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white p-8">
          <div className="space-y-5">
            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={step !== 'INPUT'}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="example@email.com"
                  />
                </div>
                {step === 'INPUT' && (
                  <button
                    onClick={handleSendEmail}
                    disabled={isLoading}
                    className="px-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 shrink-0 shadow-lg shadow-blue-500/25"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '인증'}
                  </button>
                )}
              </div>
            </div>

            {/* 인증 코드 */}
            {step === 'VERIFY' && (
              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">인증번호</label>
                  <span className={`text-sm font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-blue-600'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-center font-mono tracking-widest text-lg"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerify}
                    disabled={isLoading || code.length < 6}
                    className="px-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25"
                  >
                    확인
                  </button>
                </div>
                <button
                  onClick={handleResendEmail}
                  className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={14} />
                  재발송
                </button>
              </div>
            )}

            {/* 인증 완료 */}
            {step === 'COMPLETE' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
                <span className="font-medium">이메일 인증이 완료되었습니다</span>
              </div>
            )}

            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={step !== 'COMPLETE'}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-400"
                  placeholder="홍길동"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={step !== 'COMPLETE'}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-400"
                  placeholder="비밀번호"
                />
              </div>
            </div>

            {/* 동의 */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="agree"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                disabled={step !== 'COMPLETE'}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
              />
              <label htmlFor="agree" className="text-sm text-gray-600">
                <button
                  type="button"
                  onClick={handleOpenPrivacyPolicy}
                  className="text-blue-600 font-medium hover:underline"
                >
                  개인정보 수집
                </button>
                에 동의합니다
              </label>
            </div>

            {/* 가입 버튼 */}
            <button
              onClick={handleSignup}
              disabled={step !== 'COMPLETE' || !isAgreed || isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transform"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  처리 중...
                </>
              ) : (
                '가입하기'
              )}
            </button>
          </div>
        </div>

        {/* 로그인 링크 */}
        <p className="mt-8 text-center text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
