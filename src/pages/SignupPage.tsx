import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import Swal from 'sweetalert2';

export default function SignupPage() {
  const navigate = useNavigate();
  
  // 입력 데이터 상태
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  
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
      if (step === 'VERIFY') {
        Swal.fire({
          icon: 'error',
          title: '시간 만료',
          text: '인증 시간이 만료되었습니다. 다시 시도해주세요.',
          confirmButtonColor: '#4F46E5',
          confirmButtonText: '확인'
        });
        setStep('INPUT'); // 처음으로 되돌리기
      }
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, step]);

  // 시간 포맷팅 (05:00)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 1. 이메일 인증코드 전송
  const handleSendEmail = async () => {
    if (!email) {
        await Swal.fire({
          icon: 'warning',
          title: '입력 필요',
          text: '이메일을 입력해주세요.',
          confirmButtonColor: '#4F46E5',
          confirmButtonText: '확인'
        });
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
        confirmButtonColor: '#4F46E5',
        confirmButtonText: '확인'
      });
    } catch (e) {
      console.error(e);
      await Swal.fire({
        icon: 'error',
        title: '발송 실패',
        text: '메일 발송 실패. 서버 상태를 확인해주세요.',
        confirmButtonColor: '#4F46E5',
        confirmButtonText: '확인'
      });
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
        confirmButtonColor: '#4F46E5',
        confirmButtonText: '확인'
      });
    } catch (e) {
      console.error(e);
      await Swal.fire({
        icon: 'error',
        title: '인증 실패',
        text: '인증 코드가 올바르지 않거나 만료되었습니다.',
        confirmButtonColor: '#4F46E5',
        confirmButtonText: '확인'
      });
    }
  };

  // 3. 최종 회원가입
  const handleSignup = async () => {
    if (!name || !password) {
        await Swal.fire({
          icon: 'warning',
          title: '입력 필요',
          text: '모든 정보를 입력해주세요.',
          confirmButtonColor: '#4F46E5',
          confirmButtonText: '확인'
        });
        return;
    }
    try {
      await authApi.signup({ email, name, password });
      await Swal.fire({
        icon: 'success',
        title: '회원가입 완료',
        text: '로그인 페이지로 이동합니다.',
        confirmButtonColor: '#4F46E5',
        confirmButtonText: '확인'
      });
      navigate('/login');
    } catch (e) {
      console.error(e);
      await Swal.fire({
        icon: 'error',
        title: '가입 실패',
        text: '이미 존재하는 회원이거나 오류가 발생했습니다.',
        confirmButtonColor: '#4F46E5',
        confirmButtonText: '확인'
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-8">회원가입</h1>

        <div className="space-y-6">
          
          {/* 1단계: 이메일 입력 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
            <div className="flex gap-2">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={step !== 'INPUT'}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="example@email.com" 
              />
              {step === 'INPUT' && (
                <button 
                    onClick={handleSendEmail} 
                    className="bg-indigo-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-indigo-700 transition"
                >
                    전송
                </button>
              )}
            </div>
          </div>

          {/* 2단계: 인증번호 입력 (메일 전송 후 표시) */}
          {step === 'VERIFY' && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 animate-fade-in-down">
              <label className="block text-xs font-bold text-indigo-800 mb-1">인증번호 입력</label>
              <div className="flex gap-2 items-center">
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 p-2 border border-indigo-200 rounded focus:outline-none focus:border-indigo-500" 
                  placeholder="6자리 코드"
                  maxLength={6}
                />
                <span className="text-red-500 font-bold text-sm w-12 text-center">{formatTime(timeLeft)}</span>
                <button 
                    onClick={handleVerify} 
                    className="bg-gray-800 text-white px-3 py-2 rounded text-sm font-bold hover:bg-black transition"
                >
                    확인
                </button>
              </div>
              <p className="text-xs text-indigo-400 mt-2">* 이메일을 확인해주세요.</p>
            </div>
          )}

          {/* 인증 완료 메시지 */}
          {step === 'COMPLETE' && (
             <div className="text-green-600 font-bold text-sm text-center bg-green-50 p-3 rounded-lg border border-green-100">
                ✅ 이메일 인증이 완료되었습니다.
             </div>
          )}

          <hr className="border-gray-100" />

          {/* 3단계: 회원 정보 입력 (인증 완료 시 활성화) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이름</label>
            <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)} 
                disabled={step !== 'COMPLETE'} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 disabled:bg-gray-100"
                placeholder="홍길동"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
            <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                disabled={step !== 'COMPLETE'} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 disabled:bg-gray-100"
                placeholder="비밀번호 입력"
            />
          </div>

          <button 
            onClick={handleSignup} 
            disabled={step !== 'COMPLETE'} 
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
          >
            가입하기
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
            이미 회원이신가요? 
            <Link to="/login" className="text-indigo-600 font-bold ml-2 hover:underline">
                로그인
            </Link>
        </div>
      </div>
    </div>
  );
}