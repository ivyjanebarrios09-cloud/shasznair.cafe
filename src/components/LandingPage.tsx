import React from 'react';
import { AuthScreen } from './AuthScreen';

interface LandingPageProps {
  onEnterApp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  return <AuthScreen />;
};

export default LandingPage;
