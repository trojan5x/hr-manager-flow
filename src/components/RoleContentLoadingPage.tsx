import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import TopBar from './TopBar';

interface RoleContentLoadingPageProps {
  role: string;
  progress?: number; // 0-100 for progress indication
  statusMessage?: string;
}

const RoleContentLoadingPage: React.FC<RoleContentLoadingPageProps> = ({ 
  role, 
  progress = 0,
  statusMessage = "Generating your personalized assessment..."
}) => {
  const animationContainer = useRef<HTMLDivElement>(null);
  const animationInstance = useRef<any>(null);

  useEffect(() => {
    if (animationContainer.current) {
      // Load and play the Cosmos animation
      animationInstance.current = lottie.loadAnimation({
        container: animationContainer.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/assets/Cosmos.json'
      });
    }

    // Cleanup function
    return () => {
      if (animationInstance.current) {
        animationInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden flex flex-col" 
         style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
      
      {/* Top Bar */}
      <TopBar className="pt-2 lg:pt-4 xl:pt-6">
        <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
          <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
          <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
          <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
        </div>
      </TopBar>

      {/* Main Loading Content */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-6 lg:px-8">
        <div className="w-full max-w-2xl text-center">
          
          {/* Cosmos Animation */}
          <div className="mb-8 flex justify-center">
            <div 
              ref={animationContainer}
              className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64"
            />
          </div>

          {/* Loading Text */}
          <div className="space-y-6">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                Crafting Your{' '}
                <span className="text-[#98D048]">{role}</span>
                <br />
                Assessment
              </h1>
            </div>

            <div className="animate-fade-in-up animation-delay-300">
              <p className="text-lg md:text-xl text-gray-300">
                {statusMessage}
              </p>
            </div>

            {/* Progress Bar (if progress is provided) */}
            {progress > 0 && (
              <div className="animate-fade-in-up animation-delay-500">
                <div className="w-full bg-gray-700/50 rounded-full h-2 mb-2">
                  <div 
                    className="bg-[#98D048] h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400">{progress}% Complete</p>
              </div>
            )}

            {/* Loading Steps */}
            <div className="animate-fade-in-up animation-delay-700">
              <div className="text-sm text-gray-400 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-[#98D048] rounded-full animate-pulse" />
                  <span>Analyzing role requirements</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full" />
                  <span>Generating certificate templates</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full" />
                  <span>Creating assessment framework</span>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="animate-fade-in-up animation-delay-1000">
              <p className="text-xs text-gray-500">
                This usually takes 30-60 seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleContentLoadingPage;
