import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import Swal from 'sweetalert2';
import { RefreshCw } from 'lucide-react'; // 아이콘 사용 (없으면 텍스트로 대체 가능)

export default function SignupPage() {
  const navigate = useNavigate();
  
  // 입력 데이터 상태
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isAgreed, setIsAgreed] = useState(false); // 🔥 약관 동의 상태
  
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

  // 🔥 약관 전문 보기 모달
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
      confirmButtonColor: '#4F46E5',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-2 font-bold'
      }
    });
  };

  // 1. 이메일 인증코드 전송
  const handleSendEmail = async () => {
    if (!email) {
        await Swal.fire({ icon: 'warning', text: '이메일을 입력해주세요.', confirmButtonColor: '#4F46E5' });
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
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      await Swal.fire({ icon: 'error', text: '메일 발송 실패. 서버 상태를 확인해주세요.', confirmButtonColor: '#4F46E5' });
    }
  };

  // 🔥 [추가] 이메일 재전송 핸들러
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
        confirmButtonColor: '#4F46E5',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire({ icon: 'error', text: '재전송 실패. 잠시 후 다시 시도해주세요.', confirmButtonColor: '#4F46E5' });
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
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      await Swal.fire({ icon: 'error', text: '인증 코드가 올바르지 않거나 만료되었습니다.', confirmButtonColor: '#4F46E5' });
    }
  };

  // 3. 최종 회원가입
  const handleSignup = async () => {
    if (!name || !password) {
        await Swal.fire({ icon: 'warning', text: '모든 정보를 입력해주세요.', confirmButtonColor: '#4F46E5' });
        return;
    }
    
    // 🔥 동의 여부 체크 (혹시 버튼 활성화를 우회했을 경우 대비)
    if (!isAgreed) {
        await Swal.fire({ icon: 'warning', text: '약관에 동의해주세요.', confirmButtonColor: '#4F46E5' });
        return;
    }

    try {
      await authApi.signup({ email, name, password });
      await Swal.fire({
        icon: 'success',
        title: '회원가입 완료',
        text: '로그인 페이지로 이동합니다.',
        confirmButtonColor: '#4F46E5'
      });
      navigate('/login');
    } catch (e) {
      console.error(e);
      await Swal.fire({ icon: 'error', text: '가입 실패. 이미 존재하는 회원이거나 오류가 발생했습니다.', confirmButtonColor: '#4F46E5' });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4 font-[Pretendard]">
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
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                placeholder="example@email.com" 
              />
              {step === 'INPUT' && (
                <button 
                    onClick={handleSendEmail} 
                    className="bg-indigo-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-indigo-700 transition shadow-sm"
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
              <div className="flex gap-2 items-center mb-2">
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 p-2 border border-indigo-200 rounded focus:outline-none focus:border-indigo-500" 
                  placeholder="6자리 코드"
                  maxLength={6}
                />
                <span className={`font-bold text-sm w-12 text-center ${timeLeft < 60 ? 'text-red-500' : 'text-indigo-600'}`}>
                    {formatTime(timeLeft)}
                </span>
                <button 
                    onClick={handleVerify} 
                    className="bg-slate-800 text-white px-3 py-2 rounded text-sm font-bold hover:bg-slate-900 transition shadow-sm"
                >
                    확인
                </button>
              </div>
              
              {/* 🔥 재전송 버튼 */}
              <div className="flex justify-between items-center text-xs px-1">
                <p className="text-indigo-400">* 이메일을 확인해주세요.</p>
                <button 
                    onClick={handleResendEmail}
                    className="flex items-center gap-1 text-gray-500 hover:text-indigo-600 font-semibold underline transition-colors"
                >
                    <RefreshCw size={12} /> 인증번호 재전송
                </button>
              </div>
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 transition-colors"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 transition-colors"
                placeholder="비밀번호 입력"
            />
          </div>

          {/* 🔥 개인정보 수집 동의 체크박스 (디자인 수정됨) */}
          <div className="pt-2">
            <div 
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                step === 'COMPLETE' 
                  ? 'bg-indigo-50 border-indigo-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input 
                        type="checkbox" 
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                        disabled={step !== 'COMPLETE'} 
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:bg-gray-200 cursor-pointer accent-indigo-600"
                    />
                    <span 
                        className={`font-bold text-sm ${
                            step === 'COMPLETE' ? 'text-gray-800' : 'text-gray-400'
                        }`}
                    >
                        [필수] 개인정보 수집 및 이용 동의
                    </span>
                </label>
                
                {/* 약관 보기 버튼을 우측 끝이 아닌, 텍스트 흐름에 맞추거나 깔끔하게 배치 */}
                <button 
                    type="button"
                    onClick={handleOpenPrivacyPolicy}
                    className="text-xs text-gray-500 underline hover:text-indigo-600 transition-colors ml-2 whitespace-nowrap"
                >
                    약관 보기
                </button>
            </div>
          </div>

          <button 
            onClick={handleSignup} 
            // 🔥 동의하지 않거나 단계가 완료되지 않으면 버튼 비활성화
            disabled={step !== 'COMPLETE' || !isAgreed} 
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
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