import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CreateEventPage from './pages/host/CreateEventPage';
import HostDashboardPage from './pages/host/HostDashboardPage';
import EventLandingPage from './pages/guest/EventLandingPage';
import HostEventDetailPage from './pages/host/HostEventDetailPage';
import GuestTicketPage from './pages/guest/GuestTicketPage';
import GuestLookupPage from './pages/guest/GuestLookupPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/host/create" element={<CreateEventPage />} />
        <Route path="/host/edit/:eventId" element={<CreateEventPage />} />
        <Route path="/host/dashboard" element={<HostDashboardPage />} />
        <Route path="/:eventCode" element={<EventLandingPage />} />
        <Route path="/host/events/:eventId" element={<HostEventDetailPage />} />
        {/* 3. 게스트 (참여자) - 추가된 라우트 */}
        <Route path="/lookup" element={<GuestTicketPage />} />
        <Route path="/ticket/:qrToken" element={<GuestTicketPage />} />
        <Route path="/lookup" element={<GuestLookupPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;