import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  QrCode,
  Users,
  Clock,
  Shield,
  Sparkles,
  Calendar,
  MapPin,
  User,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { authApi, isAuthenticated } from '../api/authApi';

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());

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
    authApi.logout();
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    navigate('/');
  };

  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "선착순 마감",
      desc: "정확한 타임스탬프로 공정한 접수"
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "QR 입장",
      desc: "스캔 한 번으로 빠른 체크인"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "실시간 관리",
      desc: "참가자 현황을 한눈에 파악"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "보안 티켓",
      desc: "중복 입장 및 캡쳐 방지"
    }
  ];

  return (
    <div className="font-[Pretendard] text-slate-900 bg-white min-h-screen">

      {/* 네비게이션 */}
      <nav className={`fixed w-full z-50 top-0 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 py-4'
          : 'bg-transparent py-6'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">

          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Form PASS</span>
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/lookup" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              티켓 조회
            </Link>

            {!isLoggedIn ? (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                  로그인
                </Link>
                <button
                  onClick={handleStart}
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-colors"
                >
                  시작하기
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  <span>내 계정</span>
                  <ChevronDown size={14} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-2 overflow-hidden">
                    <button
                      onClick={() => navigate('/host/dashboard')}
                      className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      대시보드
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 모바일 메뉴 토글 */}
          <button
            className="md:hidden text-slate-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-slate-100 px-6 py-6 shadow-lg">
            <div className="flex flex-col gap-4">
              <Link to="/lookup" className="text-slate-700 font-medium py-2">티켓 조회</Link>
              <hr className="border-slate-100" />
              {!isLoggedIn ? (
                <>
                  <Link to="/login" className="text-slate-700 font-medium py-2">로그인</Link>
                  <button
                    onClick={handleStart}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold"
                  >
                    시작하기
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/host/dashboard')}
                    className="text-left text-blue-600 font-medium py-2"
                  >
                    대시보드
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-left text-slate-500 py-2"
                  >
                    로그아웃
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 히어로 섹션 */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">

          {/* 배지 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>무료로 시작하세요</span>
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
            이벤트 접수부터<br />
            <span className="text-blue-600">입장 관리</span>까지
          </h1>

          {/* 서브 타이틀 */}
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            선착순 마감, QR 체크인, 참가자 관리를<br className="hidden md:block" />
            하나의 플랫폼에서 간편하게 처리하세요.
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 flex items-center justify-center gap-2"
            >
              무료로 시작하기
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              to="/lookup"
              className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-700 rounded-xl text-lg font-medium hover:bg-slate-200 transition-colors text-center"
            >
              내 티켓 찾기
            </Link>
          </div>
        </div>
      </section>

      {/* 목업 섹션 */}
      <section className="py-16 px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              직관적인 예약 경험
            </h2>
            <p className="text-slate-500">참가자는 쉽게 예약하고, 주최자는 편하게 관리하세요</p>
          </div>

          {/* 목업 컨테이너 */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">

            {/* 예약 페이지 목업 */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-[3rem] blur-2xl opacity-50"></div>
              <div className="relative bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
                {/* 폰 프레임 노치 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-10"></div>

                {/* 화면 */}
                <div className="w-[280px] h-[560px] bg-white rounded-[2rem] overflow-hidden">
                  {/* 상단 이미지 */}
                  <div className="h-40 bg-gradient-to-br from-blue-400 to-blue-600 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-2 flex items-center justify-center backdrop-blur-sm">
                          <Calendar className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-sm font-medium opacity-90">이벤트 이미지</p>
                      </div>
                    </div>
                  </div>

                  {/* 이벤트 정보 */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-slate-900 mb-2">2025 테크 컨퍼런스</h3>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>서울 코엑스 그랜드볼룸</span>
                    </div>

                    {/* 시간 선택 */}
                    <p className="text-xs font-bold text-slate-400 mb-2">시간 선택</p>
                    <div className="space-y-2 mb-4">
                      <div className="p-3 bg-blue-50 border-2 border-blue-500 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-blue-700 text-sm">오전 10:00</p>
                          <p className="text-xs text-blue-500">잔여 23석</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="font-medium text-slate-600 text-sm">오후 2:00</p>
                        <p className="text-xs text-slate-400">잔여 45석</p>
                      </div>
                    </div>

                    {/* 입력 필드 미리보기 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">이름 입력</span>
                      </div>
                      <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                        예약하기
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 라벨 */}
              <div className="text-center mt-6">
                <p className="font-bold text-slate-900">예약 페이지</p>
                <p className="text-sm text-slate-500">참가자가 보는 화면</p>
              </div>
            </div>

            {/* 화살표 (데스크탑) */}
            <div className="hidden lg:flex flex-col items-center gap-2 text-slate-300">
              <ArrowRight className="w-8 h-8" />
              <span className="text-xs font-medium text-slate-400">예약 완료</span>
            </div>

            {/* 화살표 (모바일) */}
            <div className="lg:hidden flex items-center gap-2 text-slate-300 rotate-90">
              <ArrowRight className="w-6 h-6" />
            </div>

            {/* 티켓 목업 */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-[3rem] blur-2xl opacity-50"></div>
              <div className="relative bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
                {/* 폰 프레임 노치 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-10"></div>

                {/* 화면 */}
                <div className="w-[280px] h-[560px] bg-gradient-to-b from-slate-100 to-slate-200 rounded-[2rem] overflow-hidden flex items-center justify-center p-4">
                  {/* 티켓 카드 */}
                  <div className="w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                    {/* 보안 띠 */}
                    <div className="h-8 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                      <p className="text-white text-xs font-bold tracking-wider">VALID TICKET</p>
                    </div>

                    {/* 헤더 */}
                    <div className="bg-slate-900 text-white p-4 text-center">
                      <h3 className="font-bold">2025 테크 컨퍼런스</h3>
                      <div className="inline-flex items-center gap-1 text-xs bg-slate-700 px-2 py-1 rounded mt-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        <span>예약 확정</span>
                      </div>
                    </div>

                    {/* QR 코드 영역 */}
                    <div className="p-6 flex flex-col items-center bg-white">
                      <div className="w-32 h-32 bg-slate-100 rounded-2xl border-2 border-slate-200 flex items-center justify-center mb-4">
                        <QrCode className="w-20 h-20 text-slate-700" />
                      </div>
                      <p className="text-xs text-blue-500 font-medium">실시간 유효성 검증 중</p>
                    </div>

                    {/* 구분선 */}
                    <div className="relative h-4 bg-slate-50 flex items-center">
                      <div className="absolute left-0 w-4 h-8 bg-slate-200 rounded-r-full -ml-2"></div>
                      <div className="w-full border-b-2 border-dashed border-slate-200 mx-4"></div>
                      <div className="absolute right-0 w-4 h-8 bg-slate-200 rounded-l-full -mr-2"></div>
                    </div>

                    {/* 정보 */}
                    <div className="p-4 bg-slate-50 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">예약자</span>
                        <span className="font-bold text-slate-700">홍길동</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">입장 시간</span>
                        <span className="font-bold text-slate-700">3월 15일 10:00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 라벨 */}
              <div className="text-center mt-6">
                <p className="font-bold text-slate-900">QR 티켓</p>
                <p className="text-sm text-slate-500">입장 시 제시</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 섹션 */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              필요한 모든 것을 한 곳에서
            </h2>
            <p className="text-slate-500">복잡한 행사 운영, 이제 Form PASS로 간단하게</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-slate-500 mb-8">
            가입부터 첫 이벤트 생성까지 5분이면 충분합니다.
          </p>
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-slate-900 text-white rounded-xl text-lg font-bold hover:bg-slate-800 transition-colors"
          >
            무료로 시작하기
          </button>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-10 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-slate-900">Form PASS</span>
          </div>
          <p className="text-sm text-slate-400">
            © 2025 Form PASS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
