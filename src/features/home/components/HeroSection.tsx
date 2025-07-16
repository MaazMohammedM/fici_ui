import React from "react";
import heroImage from "../assets/Hero image.png";

const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-light dark:bg-gradient-dark h-[calc(100svh-4rem)] w-full px-16">
      <div className="flex w-full h-full items-center justify-between">
        <div className="w-1/2 h-full flex flex-col items-center justify-center">
        <h1 className="font-secondary text-6xl font-bold text-primary dark:text-secondary z-10">Real Leather. Real You.
        Premium leather shoes made from <span className="text-accent">genuine materials</span> and <span className="text-accent">honest design</span>.</h1>
       
        </div>
        <div className="w-1/2 h-full flex items-center justify-center relative">
          <img
            src={heroImage}
            alt="hero"
            className="w-fit h-fit inline-block  object-contain -rotate-45 z-10"
          />
          <div className="w-1/2 h-[50%] rounded-full bg-accent/75 absolute top-48 left-48 shadow-2xl"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
