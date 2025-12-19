import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  QrCode, 
  LayoutList, 
  Zap, 
  ShieldCheck, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  // "시작하기" 버튼 클릭 핸들러 (호스트용)
  const handleStart = () => {
    if (isLoggedIn) {
      navigate('/host/dashboard'); // 호스트 대시보드로 이동
    } else {
      navigate('/login'); // 로그인 페이지로 이동
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    // 상태 초기화를 위해 새로고침 또는 상태 업데이트
    window.location.reload(); 
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-[Pretendard] selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* 배경 장식 (Aurora Gradient) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-purple-200/30 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
      </div>

      {/* 네비게이션 */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/50 bg-white/70 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex justify-between items-center">
          
          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Form PASS</span>
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">기능 소개</Link>
            <Link to="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">요금 안내</Link>
            {/* 게스트용 티켓 조회 메뉴 추가 */}
            <Link to="/lookup" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">내 티켓 조회</Link>
          </div>

          {/* 우측 버튼 영역 */}
          <div className="hidden md:flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition">로그인</Link>
                <button 
                    onClick={handleStart} 
                    className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  무료로 시작하기
                </button>
              </>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-indigo-300 transition shadow-sm"
                >
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">MY</div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                        onClick={() => navigate('/host/dashboard')} 
                        className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
                    >
                        관리자 대시보드
                    </button>
                    <button 
                        onClick={() => navigate('/lookup')} 
                        className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
                    >
                        내 예약 확인
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">로그아웃</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 모바일 메뉴 토글 */}
          <button className="md:hidden text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 모바일 메뉴 드롭다운 */}
        {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-slate-100 px-4 py-6 shadow-xl animate-in slide-in-from-top-5">
                <div className="flex flex-col gap-4">
                    <Link to="#" className="text-slate-600 font-medium py-2">기능 소개</Link>
                    <Link to="#" className="text-slate-600 font-medium py-2">요금 안내</Link>
                    <Link to="/lookup" className="text-slate-600 font-medium py-2">내 티켓 조회</Link>
                    {!isLoggedIn ? (
                        <div className="flex flex-col gap-3 mt-4">
                            <Link to="/login" className="w-full text-center py-3 border border-slate-200 rounded-lg font-semibold text-slate-700">로그인</Link>
                            <button onClick={handleStart} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-md">무료로 시작하기</button>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => navigate('/host/dashboard')} className="w-full text-left py-2 font-medium text-slate-600">관리자 대시보드</button>
                            <button onClick={handleLogout} className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-bold mt-4">로그아웃</button>
                        </>
                    )}
                </div>
            </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 px-4 sm:px-6 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-8 shadow-sm animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                    </span>
                    BETA v1.0 출시 완료
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-[900] text-slate-900 leading-[1.15] mb-6 tracking-tight animate-fade-in-up delay-100">
                    복잡한 행사 신청,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Form PASS</span>로 끝내세요.
                </h1>
                
                <p className="text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in-up delay-200">
                    선착순 마감부터 QR 체크인까지.<br className="hidden sm:block" /> 
                    구글 폼보다 강력하고, 전문 솔루션보다 간편합니다.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 animate-fade-in-up delay-300">
                    <button 
                        onClick={handleStart} 
                        className="group flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                        지금 바로 만들기
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    {/* 데모 체험하기 버튼은 '내 티켓 조회' 페이지로 연결하여 체험 유도 가능 */}
                    <button 
                        onClick={() => navigate('/lookup')}
                        className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                        내 티켓 조회하기
                    </button>
                </div>

                <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-slate-400 text-sm animate-fade-in-up delay-500">
                    <div className="flex items-center gap-1"><CheckCircle2 size={16} className="text-indigo-500" /> 카드 등록 없음</div>
                    <div className="flex items-center gap-1"><CheckCircle2 size={16} className="text-indigo-500" /> 평생 무료 플랜</div>
                </div>
            </div>

            {/* Right Content (3D Mockup Effect) */}
            <div className="flex-1 relative w-full flex justify-center perspective-1000 animate-fade-in-up delay-300">
                {/* 배경 장식 원 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-60"></div>
                
                {/* 폰 목업 */}
                <div className="relative w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden transform rotate-[-6deg] hover:rotate-0 transition-all duration-700 ease-out hover:scale-105 z-10">
                    {/* 노치 & 버튼 */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-xl z-20"></div>
                    <div className="absolute right-[-10px] top-24 w-1 h-12 bg-slate-800 rounded-r-md"></div>
                    <div className="absolute left-[-10px] top-24 w-1 h-8 bg-slate-800 rounded-l-md"></div>

                    {/* 화면 내용 */}
                    <div className="w-full h-full bg-white pt-14 px-5 flex flex-col relative">
                        {/* 앱 헤더 */}
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-lg">My Ticket</span>
                            <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                        </div>

                        {/* 티켓 카드 */}
                        <div className="w-full bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/30 relative overflow-hidden mb-6 group">
                            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                            
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">VIP PASS</span>
                                    <h3 className="text-2xl font-bold leading-tight">2025<br/>대동제</h3>
                                </div>
                                <div className="text-right">
                                    <div className="text-indigo-200 text-xs">NO.</div>
                                    <div className="font-mono font-bold text-lg">A-042</div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-2xl mx-auto w-full aspect-square flex items-center justify-center mb-4 shadow-sm">
                                <QrCode size={120} className="text-slate-900" />
                            </div>
                            <p className="text-center text-indigo-100 text-xs font-medium">입장 시 직원에게 보여주세요</p>
                        </div>

                        {/* 하단 리스트 (UI 장식) */}
                        <div className="space-y-3">
                            <div className="w-full h-16 bg-slate-50 rounded-2xl border border-slate-100 p-3 flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">📍</div>
                                <div className="flex-1">
                                    <div className="w-20 h-3 bg-slate-200 rounded mb-2"></div>
                                    <div className="w-32 h-2 bg-slate-100 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* Social Proof (신뢰도) */}
      <div className="border-y border-slate-200 bg-white py-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-slate-400 text-sm font-semibold mb-6">TRUSTED BY INNOVATIVE TEAMS</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {/* 로고 플레이스홀더 */}
                {['Univ', 'Startups', 'Academy', 'Clubs', 'Festivals'].map((name, i) => (
                    <span key={i} className="text-xl font-black text-slate-300 select-none">{name}</span>
                ))}
            </div>
        </div>
      </div>

      {/* Feature Section */}
      <section className="py-24 px-6 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                    이벤트 운영의 <span className="text-indigo-600">모든 스트레스</span>를<br />
                    한 번에 해결해 드립니다.
                </h2>
                <p className="text-slate-500 text-lg">
                    엑셀 정리, 입금 확인, 현장 명단 체크... 이제 그만하세요.<br/>
                    폼 패스가 이 모든 과정을 자동화해드립니다.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { 
                        icon: <LayoutList size={28} />, 
                        title: '완벽한 선착순 제어', 
                        desc: '설정된 인원이 차면 0.1초 만에 자동으로 폼이 닫힙니다. 오버부킹 걱정 없이 꿀잠 주무세요.',
                        color: 'bg-blue-50 text-blue-600'
                    },
                    { 
                        icon: <Zap size={28} />, 
                        title: '커스텀 질문지 설계', 
                        desc: '이름, 학번은 기본. 행사 성격에 맞는 다양한 질문(객관식, 주관식)을 블록 쌓듯 쉽게 만드세요.',
                        color: 'bg-amber-50 text-amber-600'
                    },
                    { 
                        icon: <ShieldCheck size={28} />, 
                        title: '위조 불가능 QR 티켓', 
                        desc: '캡쳐된 이미지는 입장이 거부됩니다. 실시간 유효성 검사로 암표와 중복 입장을 원천 차단합니다.',
                        color: 'bg-emerald-50 text-emerald-600'
                    }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                        <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                        <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
            {/* 배경 데코레이션 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-30"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    지금 바로 행사를 만들어보세요.<br/>
                    <span className="text-indigo-400">비용은 0원입니다.</span>
                </h2>
                <p className="text-slate-400 mb-10 text-lg">베타 기간 동안 모든 PRO 기능을 무료로 제공합니다.</p>
                <button 
                    onClick={handleStart} 
                    className="bg-white text-slate-900 px-10 py-4 rounded-xl text-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                >
                    무료로 시작하기
                </button>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center text-white text-xs font-bold">F</div>
                        <span className="text-lg font-bold text-slate-900">Form PASS</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        누구나 쉽게 사용하는<br/>
                        이벤트 운영 관리 솔루션
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-4">Service</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><a href="#" className="hover:text-indigo-600 transition">기능 소개</a></li>
                        <li><a href="#" className="hover:text-indigo-600 transition">요금 안내</a></li>
                        <li><a href="#" className="hover:text-indigo-600 transition">업데이트 노트</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-4">Company</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><a href="#" className="hover:text-indigo-600 transition">팀 소개</a></li>
                        <li><a href="#" className="hover:text-indigo-600 transition">채용 정보</a></li>
                        <li><a href="#" className="hover:text-indigo-600 transition">문의하기</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><a href="#" className="hover:text-indigo-600 transition">이용약관</a></li>
                        <li><a href="#" className="hover:text-indigo-600 transition">개인정보처리방침</a></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-100 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-slate-400 text-sm">&copy; 2025 Form PASS. All rights reserved.</p>
                <div className="flex gap-4">
                    {/* SNS 아이콘 자리 */}
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}