import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatbotWidget from './components/ChatbotWidget';
import Home from './pages/Home';
import Results from './pages/Results';
import ChatPage from './pages/ChatPage';
import { useState } from 'react';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen flex-col">
      <Routes>
        {/* Full-page chat — no header/sidebar */}
        <Route path="/chat" element={<ChatPage />} />

        {/* All other routes with shell */}
        <Route
          path="*"
          element={
            <>
              <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />
              <div className="flex flex-1 overflow-hidden">
                <Sidebar open={sidebarOpen} />
                <main
                  className={`flex-1 overflow-y-auto transition-all duration-300 ${
                    sidebarOpen ? 'lg:ml-0' : ''
                  }`}
                >
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/results/*" element={<Results />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
              <ChatbotWidget />
            </>
          }
        />
      </Routes>
    </div>
  );
}
