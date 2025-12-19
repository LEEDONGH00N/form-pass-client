// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { AxiosResponse } from 'axios';
import Swal from 'sweetalert2';

// 서버의 로그인 응답 데이터 구조 정의
interface LoginResponseData {
  accessToken: string;
  // refreshToken?: string;
  // userDetails?: any;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. API 호출
      const response: AxiosResponse<LoginResponseData> = await authApi.login(formData);
      
      // 2. 토큰 저장 로직
      const accessToken = response.data.accessToken; 
      
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);

        await Swal.fire({
          icon: 'success',
          title: '로그인 성공',
          text: '환영합니다!',
          confirmButtonColor: '#4F46E5',
          confirmButtonText: '확인'
        });

        // ⭐⭐⭐ 수정된 부분: 홈('/') 대신 대시보드('/host/dashboard')로 이동 ⭐⭐⭐
        navigate('/host/dashboard');
      } else {
         // 토큰을 받지 못했으나 200 OK를 받은 경우
        await Swal.fire({
          icon: 'warning',
          title: '경고',
          text: '로그인은 성공했지만, 토큰 정보가 불완전합니다. 개발자에게 문의하세요.',
          confirmButtonColor: '#4F46E5',
          confirmButtonText: '확인'
        });
        console.error("로그인 성공 응답 데이터:", response.data);
      }

    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: 'error',
        title: '로그인 실패',
        text: '이메일 또는 비밀번호를 확인해주세요.',
        confirmButtonColor: '#4F46E5',
        confirmButtonText: '확인'
      });
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