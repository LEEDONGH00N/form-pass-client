// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import Swal from 'sweetalert2';
import { Ticket } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // API 호출 (토큰이 localStorage에 저장됨)
      await authApi.login(formData);

      await Swal.fire({
        icon: 'success',
        title: '로그인 성공',
        text: '환영합니다!',
        confirmButtonColor: '#3B82F6',
        confirmButtonText: '확인'
      });

      navigate('/host/dashboard');

    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: 'error',
        title: '로그인 실패',
        text: '이메일 또는 비밀번호를 확인해주세요.',
        confirmButtonColor: '#3B82F6',
        confirmButtonText: '확인'
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 relative overflow-hidden">

      {/* 배경 장식 요소 */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-20 -right-32 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      <div className="relative bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl shadow-blue-100/50 w-full max-w-md text-center border border-white/50 animate-fade-in-up">

        {/* 로고 아이콘 박스 */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
          <Ticket className="w-8 h-8 text-white" />
        </div>

        {/* 헤더 */}
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2 tracking-tight">Form PASS</h1>
        <p className="text-gray-500 mb-8 text-sm">서비스 이용을 위해 로그인해주세요.</p>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="text-left space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3.5 bg-gray-50/50 border border-gray-200/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all duration-200"
              placeholder="example@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3.5 bg-gray-50/50 border border-gray-200/80 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all duration-200"
              placeholder="비밀번호 입력"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            로그인
          </button>
        </form>

        {/* 푸터 링크 */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            회원이 아니신가요?
            <Link to="/signup" className="text-blue-600 font-bold ml-2 hover:underline hover:text-blue-700 transition-colors">
              회원가입 하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
