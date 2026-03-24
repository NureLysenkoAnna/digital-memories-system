import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import StarBackground from '../components/StarBackground';
import Header from '../components/Header';
import { Star } from 'lucide-react';

const MainPage = () => {
  return (
    <div className="landing-container">
      <StarBackground />
      
      <Header pageType="main" />

      <main className="hero-section">
        <div className="glass-panel hero-glass-card">
          <h1 className="hero-title">
            Збережіть сяйво найтепліших моментів!
          </h1>

          <p className="hero-subtitle">
            Спогади — мов зорі, що розкинулися на нічному небі. Деякі сяють яскраво,
            інші — ледь помітні, але всі вони, переплітаючись, формують унікальну історію...
            <br />
            Організовуйте спогади, діліться ними з близькими і повертайтеся до найяскравіших моментів!
          </p>

          <Link to="/register" className="cta-button">
            <Star fill="currentColor" size={20} />
            Створити власне сузір’я зі спогадів
          </Link>
        </div>
      </main>
    </div>
  );
};

export default MainPage;