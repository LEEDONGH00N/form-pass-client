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
  Zap,
  CheckCircle,
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
      desc: "정확한 타임스탬프로 공정하게 접수를 마감합니다"
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "QR 체크인",
      desc: "스캔 한 번으로 빠르고 간편한 입장 처리"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "실시간 관리",
      desc: "참가자 현황을 대시보드에서 한눈에 파악"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "보안 티켓",
      desc: "중복 입장 방지 및 위변조 차단"
    }
  ];

  return (
    <div className="font-[Pretendard] text-gray-900 bg-white min-h-screen">

      {/* 네비게이션 */}
      <nav className={`fixed w-full z-50 top-0 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Form PASS</span>
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/lookup" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              티켓 조회
            </Link>

            {!isLoggedIn ? (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  로그인
                </Link>
                <button
                  onClick={handleStart}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                >
                  시작하기
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                >
                  <span>내 계정</span>
                  <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden">
                    <button
                      onClick={() => navigate('/host/dashboard')}
                      className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      대시보드
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors"
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
            className="md:hidden text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 px-6 py-4 shadow-lg">
            <div className="flex flex-col gap-2">
              <Link to="/lookup" className="text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50">티켓 조회</Link>
              {!isLoggedIn ? (
                <>
                  <Link to="/login" className="text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50">로그인</Link>
                  <button
                    onClick={handleStart}
                    className="mt-2 w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold"
                  >
                    시작하기
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/host/dashboard')}
                    className="text-left text-blue-600 font-medium py-3 px-4 rounded-lg hover:bg-blue-50"
                  >
                    대시보드
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-left text-gray-500 py-3 px-4 rounded-lg hover:bg-gray-50"
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
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          {/* 배지 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-8">
            <Zap className="w-4 h-4" />
            <span>무료로 시작하세요</span>
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            이벤트 접수부터<br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">입장 관리</span>까지
          </h1>

          {/* 서브 타이틀 */}
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            선착순 마감, QR 체크인, 참가자 관리를<br className="hidden md:block" />
            하나의 플랫폼에서 간편하게 처리하세요.
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              무료로 시작하기
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              to="/lookup"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-2xl text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-all text-center"
            >
              내 티켓 찾기
            </Link>
          </div>
        </div>
      </section>

      {/* 기능 섹션 */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              필요한 모든 기능을 한 곳에서
            </h2>
            <p className="text-gray-500 text-lg">복잡한 행사 운영, 이제 Form PASS로 간단하게</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 장점 섹션 */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                왜 Form PASS인가요?
              </h2>
              <div className="space-y-5">
                {[
                  '5분 만에 이벤트 페이지 생성',
                  '실시간 참가자 현황 대시보드',
                  'QR코드로 빠른 입장 체크인',
                  '모바일 최적화된 예약 페이지',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <CheckCircle size={18} />
                    </div>
                    <span className="text-gray-700 text-lg">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white">
              <div className="text-6xl font-bold mb-2">100%</div>
              <div className="text-xl font-semibold mb-4 text-blue-100">무료로 사용</div>
              <p className="text-blue-100 leading-relaxed">
                모든 기능을 무료로 사용하세요. 숨겨진 비용이나 제한 없이 이벤트를 운영할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-500 to-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-blue-100 text-lg mb-10">
            가입부터 첫 이벤트 생성까지 5분이면 충분합니다.
          </p>
          <button
            onClick={handleStart}
            className="px-10 py-4 bg-white text-blue-600 rounded-2xl text-lg font-bold hover:bg-blue-50 transition-colors shadow-xl"
          >
            무료로 시작하기
          </button>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-10 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Form PASS</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 Form PASS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
