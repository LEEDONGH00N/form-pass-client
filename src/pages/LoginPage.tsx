import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // API 호출
      const response = await authApi.login(formData);
      
      // 토큰 저장 (실제 서버 응답 구조에 따라 response.data.accessToken 등으로 수정)
      // 현재는 성공했다는 표시로 문자열 저장
      localStorage.setItem('accessToken', 'dummy-token'); 
      
      alert("로그인 성공! 환영합니다. 👋");
      
      // 홈 화면으로 이동 (Navbar 상태 반영을 위해 window.location 사용 가능)
      // 리액트 라우터 방식:
      navigate('/');
      
    } catch (error) {
      console.error(error);
      alert("로그인 실패: 이메일 또는 비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md text-center">
        
        {/* 헤더 */}
        <h1 className="text-3xl font-extrabold text-indigo-600 mb-2 tracking-tight">Form PASS</h1>
        <p className="text-gray-500 mb-8 text-sm">서비스 이용을 위해 로그인해주세요.</p>
        
        {/* 폼 */}
        <form onSubmit={handleSubmit} className="text-left space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="email">이메일</label>
            <input 
              type="email" 
              id="email" 
              value={formData.email}
              onChange={handleChange} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition" 
              placeholder="example@email.com"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="password">비밀번호</label>
            <input 
              type="password" 
              id="password" 
              value={formData.password}
              onChange={handleChange} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition" 
              placeholder="비밀번호 입력"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-md hover:shadow-lg transform active:scale-95"
          >
            로그인
          </button>
        </form>

        {/* 푸터 링크 */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            회원이 아니신가요? 
            <Link to="/signup" className="text-indigo-600 font-bold ml-2 hover:underline">
              회원가입 하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}