import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StarBackground from '../components/layout/StarBackground';
import MainHeader from '../components/layout/MainHeader';
import { Star } from 'lucide-react';

const MainPage = () => {
  const { t } = useTranslation();

  return (
    <div className="landing-container">
      <StarBackground />
      
      <MainHeader pageType="main" />

      <main className="hero-section">
        <div className="glass-panel hero-glass-card">
          <h1 className="hero-title">
            {t('landing.title')}
          </h1>

          <p className="hero-subtitle">
            {t('landing.subtitle_p1')}
            <br />
            {t('landing.subtitle_p2')}
          </p>

          <Link to="/register" className="cta-button">
            <Star fill="currentColor" size={20} />
            {t('landing.cta_button')}
          </Link>
        </div>
      </main>
    </div>
  );
};

export default MainPage;