import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; 

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // <React.StrictMode> // 개발 중 console.log가 두 번 찍히는 게 싫다면 주석 처리해도 됨
    <App />
  // </React.StrictMode>
);