import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 페이지 로드 시 로그인 여부 체크
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  // '바로 시작하기' 버튼 핸들러
  const handleStart = () => {
    if (isLoggedIn) {
      alert("이벤트 관리 대시보드로 이동합니다! (추후 구현)");
      // navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    alert("로그아웃 되었습니다.");
    window.location.reload(); // 상태 초기화를 위해 새로고침
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen font-sans overflow-x-hidden">
      
      {/* 네비게이션 (Sticky & Blur) */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2">
            {/* public/logo.png 파일이 있다고 가정 */}
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-cover" onError={(e) => e.currentTarget.src='https://placehold.co/40x40/6C63FF/white?text=F'} />
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">Form PASS</span>
          </Link>

          {/* 메뉴 영역 */}
          <div className="flex items-center space-x-2 md:space-x-6">
            {!isLoggedIn ? (
              // 비로그인 상태
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-gray-600 font-medium hover:text-indigo-600 transition">로그인</Link>
                <button onClick={handleStart} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md hover:shadow-lg">
                  바로 시작하기
                </button>
              </div>
            ) : (
              // 로그인 상태 (프로필 메뉴)
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                  className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 focus:outline-none transition hover:bg-indigo-200"
                >
                  MY
                </button>
                
                {/* 드롭다운 메뉴 */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in-down">
                    <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition">
                      내 예약 확인
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 transition">
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <header className="pt-40 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
            
            {/* 텍스트 영역 */}
            <div className="flex-1 text-center md:text-left z-10">
                <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-indigo-100">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
                    🚀 베타 서비스 오픈
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                    선착순 마감부터<br />
                    <span className="text-indigo-600">입장 QR 체크인까지.</span>
                </h1>
                <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto md:mx-0">
                    구글 폼의 간편함에 <strong>강력한 예약 관리</strong>를 더했습니다.<br />
                    대학 축제, 팝업 스토어, 원데이 클래스를 위한 최고의 솔루션.
                </p>
                <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                    <button onClick={handleStart} className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl hover:bg-indigo-700 transition transform hover:-translate-y-1">
                        지금 무료로 만들기
                    </button>
                    <button className="bg-white border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 transition">
                        데모 체험하기
                    </button>
                </div>
            </div>

            {/* 우측 이미지 (Mockup) */}
            <div className="flex-1 relative flex justify-center w-full">
                <div className="relative w-72 h-[500px] bg-gray-900 rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden transform rotate-[-5deg] hover:rotate-0 transition duration-500">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-20"></div>
                    <div className="w-full h-full bg-white pt-12 px-6 flex flex-col items-center">
                        <div className="w-full bg-indigo-600 rounded-2xl p-6 text-white shadow-lg text-center relative overflow-hidden mt-4">
                            <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded mb-3 inline-block">VIP PASS</span>
                            <h3 className="text-xl font-bold mb-1">2025 대동제</h3>
                            <p className="text-indigo-200 text-sm mb-6">05. 24(금) 18:00 입장</p>
                            <div className="bg-white p-2 rounded-xl mx-auto w-24 h-24 flex items-center justify-center mb-2">
                                <span className="text-4xl">🏁</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* 특징 섹션 */}
      <section className="max-w-7xl mx-auto px-6 mt-10 mb-32">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">왜 Form PASS인가요?</h2>
            <p className="text-gray-500">복잡한 엑셀 정리와 입장 확인, 이제 그만하세요.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            {[
                { icon: '⏰', title: '칼 같은 선착순 마감', desc: '정원이 차면 자동으로 닫힙니다. 오버부킹 없는 깔끔한 마감을 경험하세요.' },
                { icon: '📝', title: '내 맘대로 질문 설계', desc: '이름, 연락처는 기본. 행사 성격에 맞는 다양한 질문을 자유롭게 추가하세요.' },
                { icon: '📱', title: '1초 QR 입장 스캔', desc: '종이 명단은 그만. 관리자 앱으로 QR코드만 찍으면 입장이 완료됩니다.' }
            ].map((item, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition duration-300 hover:-translate-y-2 group">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-indigo-600 group-hover:text-white transition">
                        {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12 text-center">
        <p className="text-gray-400 text-sm">&copy; 2025 Form PASS. All rights reserved.</p>
      </footer>
    </div>
  );
}