import React from 'react';
import { AuthScreen } from './AuthScreen';

interface LandingPageProps {
  onEnterApp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  return (
    <div className="flex flex-col min-h-screen bg-stone-950">
      <div className="sketchfab-embed-wrapper w-full h-[400px]">
        <iframe 
          title="Coffee" 
          frameBorder="0" 
          allowFullScreen 
          mozAllowFullScreen={true} 
          webkitAllowFullScreen={true} 
          allow="autoplay; fullscreen; xr-spatial-tracking" 
          src="https://sketchfab.com/models/963a9e5d288c42509886c5efd4fedd3c/embed?transparent=1"
          className="w-full h-full"
        />
        <p style={{fontSize: '13px', fontWeight: 'normal', margin: '5px', color: '#4A4A4A'}}>
          <a href="https://sketchfab.com/3d-models/coffee-963a9e5d288c42509886c5efd4fedd3c" target="_blank" rel="nofollow" style={{fontWeight: 'bold', color: '#1CAAD9'}}> Coffee </a> 
          by <a href="https://sketchfab.com/rosnandie.yikie" target="_blank" rel="nofollow" style={{fontWeight: 'bold', color: '#1CAAD9'}}> Rosnandie Yikie </a> 
          on <a href="https://sketchfab.com" target="_blank" rel="nofollow" style={{fontWeight: 'bold', color: '#1CAAD9'}}>Sketchfab</a>
        </p>
      </div>
      <AuthScreen />
    </div>
  );
};

export default LandingPage;
