import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Menu, 
  X,
  ChevronDown,
  MousePointer2,
  Globe2,
  ShieldCheck,
  Zap,
  BarChart3,
  Layers
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStart = () => {
    if (isLoggedIn) {
      navigate('/host/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    window.location.reload(); 
  };

  return (
    <div className="font-[Pretendard] text-slate-900 bg-white overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* CSS 애니메이션 정의 (Tailwind 설정 없이도 동작하도록 인라인 스타일 주입) */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>

      {/* ====================================================================================
          네비게이션 바
      ==================================================================================== */}
      <nav 
        className={`fixed w-full z-50 top-0 start-0 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-lg border-b border-gray-100 py-4 shadow-sm' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex justify-between items-center">
          
          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2 group z-50">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${isScrolled ? 'bg-indigo-600' : 'bg-white'}`}>
                <span className={`font-bold text-lg ${isScrolled ? 'text-white' : 'text-slate-900'}`}>F</span>
            </div>
            <span className={`text-2xl font-[900] tracking-tighter transition-colors duration-300 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
              Form PASS
            </span>
          </Link>

          {/* 데스크탑 메뉴 (성공사례, 요금안내 제거됨) */}
          <div className="hidden md:flex items-center gap-12">
            {['솔루션 소개', '고객 지원'].map((item) => (
              <Link 
                key={item} 
                to="#" 
                className={`text-[15px] font-semibold tracking-tight transition-all duration-300 hover:-translate-y-0.5 ${
                    isScrolled 
                    ? 'text-slate-600 hover:text-indigo-600' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {item}
              </Link>
            ))}
          </div>

          {/* 우측 버튼 영역 */}
          <div className="hidden md:flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                <Link 
                  to="/login" 
                  className={`text-[15px] font-semibold transition-colors duration-300 ${isScrolled ? 'text-slate-900 hover:text-indigo-600' : 'text-white hover:text-white/80'}`}
                >
                  로그인
                </Link>
                <button 
                    onClick={handleStart} 
                    className={`px-6 py-2.5 text-[15px] font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                        isScrolled 
                        ? 'bg-slate-900 text-white hover:bg-indigo-600' 
                        : 'bg-white text-slate-900 hover:bg-indigo-50'
                    }`}
                >
                  무료로 시작하기
                </button>
              </>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                      isScrolled ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/10 border-white/30 text-white backdrop-blur-md'
                  }`}
                >
                  <span className="text-xs font-bold">MY</span>
                  <ChevronDown size={14} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <button 
                        onClick={() => navigate('/host/dashboard')} 
                        className="block w-full text-left px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
                    >
                        관리자 대시보드
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={handleLogout} className="block w-full text-left px-5 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition">로그아웃</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 모바일 메뉴 토글 */}
          <button className={`md:hidden ${isScrolled ? 'text-slate-900' : 'text-white'}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 모바일 메뉴 드롭다운 */}
        {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-slate-100 px-6 py-8 shadow-2xl animate-in slide-in-from-top-5">
                <div className="flex flex-col gap-6 text-lg">
                    <Link to="#" className="text-slate-900 font-bold">솔루션 소개</Link>
                    <Link to="#" className="text-slate-900 font-bold">고객 지원</Link>
                    <div className="h-px bg-slate-100"></div>
                    {!isLoggedIn ? (
                        <div className="flex flex-col gap-3">
                            <Link to="/login" className="text-slate-600 font-medium py-2">로그인</Link>
                            <button onClick={handleStart} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold">무료로 시작하기</button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <button onClick={() => navigate('/host/dashboard')} className="text-left font-bold text-indigo-600">관리자 대시보드</button>
                            <button onClick={handleLogout} className="text-left text-slate-500">로그아웃</button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </nav>

      {/* ====================================================================================
          MAIN HERO SECTION
      ==================================================================================== */}
      <header className="relative w-full h-[110vh] min-h-[800px] flex items-center justify-center overflow-hidden bg-slate-950">
        
        {/* 배경 효과 */}
        <div className="absolute inset-0 z-0">
            {/* 배경 이미지 */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay scale-105 animate-pulse-slow"></div>
            
            {/* 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950"></div>
            
            {/* 장식용 빛나는 원 (Aurora Effect) */}
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] animate-float"></div>
            <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] animate-float delay-1000"></div>
        </div>

        {/* 텍스트 컨텐츠 */}
        <div className="relative z-10 text-center max-w-6xl px-6 -mt-20">
            <div className="inline-block mb-6 animate-fade-in-up">
                <span className="px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-indigo-300 text-sm font-bold tracking-widest uppercase">
                    The Future of Event Management
                </span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-[900] text-white leading-tight mb-8 tracking-tight drop-shadow-2xl animate-fade-in-up delay-100">
                행사의 기준을<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-indigo-200">완벽히 제어하다</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl mx-auto mb-14 leading-relaxed animate-fade-in-up delay-200">
                선착순 마감부터 QR 입장 관리까지.<br/>
                가장 진보된 이벤트 솔루션 Form PASS를 경험하세요.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in-up delay-300">
                <button 
                    onClick={handleStart}
                    className="group relative px-12 py-5 bg-white text-slate-950 rounded-full text-lg font-bold hover:bg-indigo-50 transition-all duration-300 shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] hover:scale-105 overflow-hidden"
                >
                    <span className="relative z-10">무료로 시작하기</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                <button className="px-12 py-5 bg-white/5 border border-white/20 text-white rounded-full text-lg font-medium hover:bg-white/10 transition-all duration-300 backdrop-blur-sm group flex items-center gap-2">
                    솔루션 문의
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                </button>
            </div>
        </div>

        {/* 하단 스크롤 유도 */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-white/30 animate-bounce">
            <ChevronDown size={32} />
        </div>
      </header>

      {/* ====================================================================================
          SECTION 1: IMPACT (숫자 강조)
      ==================================================================================== */}
      <section className="relative -mt-32 z-20 px-6">
        <div className="max-w-[1200px] mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-12 md:p-20 border border-slate-100">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center divide-x divide-slate-100">
                <div className="group">
                    <div className="text-5xl md:text-6xl font-[900] mb-3 text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-600 group-hover:scale-110 transition-transform duration-300">0<span className="text-3xl text-slate-400 align-top">원</span></div>
                    <div className="text-slate-500 font-medium">초기 도입 비용</div>
                </div>
                <div className="group">
                    <div className="text-5xl md:text-6xl font-[900] mb-3 text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-600 group-hover:scale-110 transition-transform duration-300">99<span className="text-3xl text-slate-400 align-top">%</span></div>
                    <div className="text-slate-500 font-medium">서비스 가동률</div>
                </div>
                <div className="group">
                    <div className="text-5xl md:text-6xl font-[900] mb-3 text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-600 group-hover:scale-110 transition-transform duration-300">0.1<span className="text-3xl text-slate-400 align-top">s</span></div>
                    <div className="text-slate-500 font-medium">티켓 발권 속도</div>
                </div>
                <div className="group">
                    <div className="text-5xl md:text-6xl font-[900] mb-3 text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-600 group-hover:scale-110 transition-transform duration-300">No.1</div>
                    <div className="text-slate-500 font-medium">고객 만족도</div>
                </div>
            </div>
        </div>
      </section>

      {/* ====================================================================================
          SECTION 2: PHILOSOPHY (텍스트 중심)
      ==================================================================================== */}
      <section className="py-40 px-6 bg-white relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50 pointer-events-none"></div>

        <div className="max-w-[1200px] mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div>
                    <span className="text-indigo-600 font-bold tracking-wider text-sm uppercase mb-4 block">Our Philosophy</span>
                    <h3 className="text-4xl md:text-6xl font-[900] text-slate-900 leading-[1.1] mb-10">
                        기술로 행사의<br/>
                        <span className="text-indigo-600 inline-block relative">
                            본질
                            <span className="absolute bottom-2 left-0 w-full h-3 bg-indigo-100 -z-10"></span>
                        </span>에 집중합니다.
                    </h3>
                    <div className="w-24 h-1.5 bg-slate-900 mb-10"></div>
                </div>
                <div>
                    <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-light mb-8">
                        "왜 이벤트 기획자는 항상 밤을 새워야 할까요?"
                    </p>
                    <p className="text-lg text-slate-500 leading-relaxed">
                        우리는 기획자가 반복적인 운영 업무에서 벗어나, 
                        참가자에게 더 나은 경험을 제공하는 데 집중할 수 있도록 돕습니다.
                        <br/><br/>
                        Form PASS는 단순한 설문 도구가 아닙니다. 
                        신청부터 입장까지의 모든 여정을 매끄럽게 연결하는 
                        <strong> 통합 이벤트 운영 솔루션</strong>입니다.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* ====================================================================================
          SECTION 3: FEATURES (카드 그리드 + 글래스모피즘)
      ==================================================================================== */}
      <section className="py-32 px-6 bg-slate-950 text-white relative">
        {/* 배경 그리드 패턴 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

        <div className="max-w-[1400px] mx-auto relative z-10">
            <div className="text-center mb-24">
                <span className="text-indigo-400 font-bold tracking-wider text-sm uppercase">Key Features</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-4">압도적인 퍼포먼스</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="group bg-white/5 backdrop-blur-sm border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
                    <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
                        <MousePointer2 size={32} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">정확한 선착순 제어</h3>
                    <p className="text-gray-400 leading-relaxed text-lg">
                        0.01초 단위의 타임스탬프 기록으로 공정한 선착순 마감을 보장합니다.
                        오버부킹 없는 안정적인 시스템.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="group bg-white/5 backdrop-blur-sm border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
                    <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]">
                        <Globe2 size={32} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">제약 없는 확장성</h3>
                    <p className="text-gray-400 leading-relaxed text-lg">
                        소규모 동아리 모임부터 대규모 기업 컨퍼런스까지.
                        어떤 규모의 행사라도 유연하게 대응합니다.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="group bg-white/5 backdrop-blur-sm border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
                    <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_30px_-5px_rgba(45,212,191,0.3)]">
                        <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">강력한 보안 QR</h3>
                    <p className="text-gray-400 leading-relaxed text-lg">
                        단순 이미지가 아닌, 암호화된 동적 QR 코드를 발급합니다.
                        캡쳐본 사용과 중복 입장을 원천 차단합니다.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* ====================================================================================
          SECTION 4: FUNCTIONALITY (아이콘 리스트)
      ==================================================================================== */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-[1200px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-20">
                <div className="relative">
                    {/* 이미지 자리 */}
                    <div className="sticky top-32 bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 p-8 border border-slate-100 h-[600px] flex items-center justify-center overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50"></div>
                        <div className="relative z-10 text-center">
                            <div className="w-24 h-24 bg-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                                <Zap size={48} />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-2">Easy & Powerful</h3>
                            <p className="text-slate-500">누구나 쉽게, 하지만 기능은 강력하게</p>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-8 py-10">
                    <h3 className="text-4xl font-bold text-slate-900 mb-12">
                        성공적인 행사를 위한<br/>
                        <span className="text-indigo-600">올인원 툴킷</span>
                    </h3>

                    {[
                        { icon: <Layers />, title: "커스텀 폼 빌더", desc: "드래그 앤 드롭으로 원하는 질문지를 자유롭게 구성하세요." },
                        { icon: <BarChart3 />, title: "실시간 대시보드", desc: "신청 현황과 입장률을 한눈에 파악하고 엑셀로 다운로드하세요." },
                        { icon: <ShieldCheck />, title: "자동 입장 관리", desc: "QR 스캔 한 번으로 입장을 처리하고 중복 입장을 방지합니다." }
                    ].map((item, i) => (
                        <div key={i} className="flex gap-6 p-6 rounded-3xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-100">
                            <div className="w-14 h-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
                                {item.icon}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* ====================================================================================
          SECTION 5: CTA (그라데이션 배경)
      ==================================================================================== */}
      <section className="py-32 px-6 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 opacity-50"></div>
        <div className="absolute -top-[50%] -right-[20%] w-[1000px] h-[1000px] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                망설임은 행사의 성공만<br/>
                <span className="text-indigo-400">늦출 뿐입니다.</span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 font-light">
                베타 기간 한정, 모든 PRO 기능을 무료로 제공해 드립니다.
            </p>
            <button 
                onClick={handleStart}
                className="group inline-flex items-center gap-3 px-12 py-6 bg-white text-slate-900 rounded-full text-xl font-bold hover:bg-indigo-50 transition-all duration-300 shadow-[0_0_40px_-5px_rgba(255,255,255,0.4)] hover:-translate-y-1"
            >
                무료로 시작하기
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </section>

      {/* ====================================================================================
          FOOTER
      ==================================================================================== */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
        <div className="max-w-[1400px] mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-16 mb-16">
                <div className="col-span-1 md:col-span-1">
                    <span className="text-2xl font-[900] text-slate-900 block mb-6">Form PASS</span>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Form PASS는 이벤트 운영의 새로운 표준을 제시합니다.
                        기술로 사람을 연결하고, 경험을 혁신합니다.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-6">Product</h4>
                    <ul className="space-y-4 text-sm text-slate-500">
                        <li><a href="#" className="hover:text-indigo-600 transition">주요 기능</a></li>
                        <li><a href="#" className="hover:text-indigo-600 transition">보안 시스템</a></li>
                        <li><a href="#" className="hover:text-indigo-600 transition">업데이트 노트</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-6">Support</h4>
                    <ul className="space-y-4 text-sm text-slate-500">
                        <li><a href="#" className="hover:text-indigo-600 transition">도움말 센터</a></li>
                        <li><a href="#" className="hover:text-indigo-600 transition">API 문서</a></li>
                        <li><a href="#" className="hover:text-indigo-600 transition">문의하기</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-6">Company</h4>
                    <ul className="space-y-4 text-sm text-slate-500">
                        <li><a href="#" className="hover:text-indigo-600 transition">팀 소개</a></li>
                        <li><a href="#" className="hover:text-indigo-600 transition">채용 정보</a></li>
                        <li><a href="#" className="hover:text-indigo-600 transition">개인정보처리방침</a></li>
                    </ul>
                </div>
            </div>
            
            <div className="border-t border-slate-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                <p>&copy; 2025 Form PASS Inc. All rights reserved.</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-slate-600">이용약관</a>
                    <a href="#" className="hover:text-slate-600">개인정보처리방침</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}