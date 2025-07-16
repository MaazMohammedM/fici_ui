import React from 'react';
import HeroSection from './components/HeroSection';
import Footer from 'component/Footer';

const HomePage: React.FC = () => {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Main content */}
      <div className="flex-grow">
        <HeroSection />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default HomePage;