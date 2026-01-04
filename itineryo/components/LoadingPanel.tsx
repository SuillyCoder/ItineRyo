export function LoadingPanel() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#D6D0C0' }}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="/assets/Kanagawa.jpg" 
          alt="The Great Wave" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-linear-to-br from-[#D6D0C0]/80 to-[#C8B8A5]/70" />
      </div>

      {/* Loading Content */}
      <div className="relative z-10 text-center">
        {/* Animated Logo */}
        <div className="mb-8 relative">
          {/* Pulsing Outer Ring */}
          <div 
            className="absolute inset-0 w-32 h-32 mx-auto rounded-full animate-ping"
            style={{ 
              backgroundColor: '#D64820',
              opacity: 0.2,
              animationDuration: '2s'
            }}
          />
          
          {/* Main Logo Circle */}
          <div 
            className="w-32 h-32 mx-auto rounded-full flex items-center justify-center relative animate-pulse"
            style={{ 
              backgroundColor: '#BF2809',
              animationDuration: '2s'
            }}
          >
            {/* Inner decorative circle */}
            <div className="absolute inset-4 rounded-full border-2 border-[#D6D0C0] opacity-50" />
            
            {/* Kanji */}
            <span 
              className="text-6xl relative z-10"
              style={{ color: '#D6D0C0' }}
            >
              旅
            </span>
          </div>
        </div>

        {/* App Name */}
        <h1 
          className="text-4xl mb-4 animate-fade-in"
          style={{ 
            fontFamily: "'Noto Serif JP', serif",
            color: '#2c2416',
            letterSpacing: '0.05em'
          }}
        >
          Itine-Ryo
        </h1>

        {/* Loading Text */}
        <p 
          className="text-lg mb-8 animate-fade-in"
          style={{ 
            fontFamily: "'Noto Sans JP', sans-serif",
            color: '#7D7463',
            animationDelay: '0.2s'
          }}
        >
          Loading your journeys...
        </p>

        {/* Loading Bar */}
        <div 
          className="w-64 h-2 mx-auto rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(125, 116, 99, 0.2)' }}
        >
          <div 
            className="h-full rounded-full animate-loading-bar"
            style={{ 
              background: 'linear-gradient(90deg, #D64820 0%, #BF2809 100%)',
              width: '40%'
            }}
          />
        </div>

        {/* Japanese Text */}
        <p 
          className="mt-8 animate-fade-in"
          style={{ 
            fontFamily: "'Noto Serif JP', serif",
            color: '#7D7463',
            fontSize: '0.9rem',
            letterSpacing: '0.1em',
            opacity: 0.6,
            animationDelay: '0.4s'
          }}
        >
          お待ちください
        </p>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(300%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
