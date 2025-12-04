import React from 'react';
import desktopImage from '../../../assets/desktop_slide_2125x914.png';
import mobileImage from '../../../assets/mobile_slide.png';

const InstructionSection: React.FC = () => {
  return (
    <div className="w-full">
      {/* Mobile Image - shown on small screens */}
      <picture className="block md:hidden w-full">
        <source srcSet={mobileImage} media="(max-width: 767px)" />
        <img
          src={mobileImage}
          alt="Mobile instructions"
          className="w-full h-auto"
        />
      </picture>

      {/* Desktop Image - shown on medium screens and up */}
      <picture className="hidden md:block w-full">
        <source srcSet={desktopImage} media="(min-width: 768px)" />
        <img
          src={desktopImage}
          alt="Desktop instructions"
          className="w-full h-auto"
        />
      </picture>
    </div>
  );
};

export default InstructionSection;