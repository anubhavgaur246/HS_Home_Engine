import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ToolGrid } from './components/ToolGrid';
import { Footer } from './components/Footer';
import { HubAssistant } from './components/HubAssistant';
import { TOOLS } from './config/tools';

export function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('highspring-theme') || 'dark';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Sync theme attribute with document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('highspring-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-canvas">
      {/* Simple, Elegant, Executive Background */}
      <div className="ambient-backdrop-refined" aria-hidden="true">
        <div className="subtle-precision-grid" />
        <div className="ambient-top-glow" />
        <div className="ambient-bottom-glow" />
      </div>

      {/* Navigation Header */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content */}
      <main id="main-content" className="main-content-flow">
        <Hero />

        <ToolGrid
          tools={TOOLS}
          searchQuery={searchQuery}
          onResetSearch={() => setSearchQuery('')}
        />
      </main>

      {/* Enterprise Footer */}
      <Footer />

      {/* Interactive Highspring Assistant & User Manuals Bot */}
      <HubAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onOpen={() => setIsAssistantOpen(true)}
      />
    </div>
  );
}

export default App;
