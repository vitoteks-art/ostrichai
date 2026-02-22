import React from 'react';
import { GoogleOAuthSettings as GoogleOAuthSettingsComponent } from '../components/GoogleOAuthSettings';

const GoogleOAuthSettings: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Google OAuth Settings</h1>
        <p className="text-muted-foreground">
          Configure Google OAuth for seamless user authentication
        </p>
      </div>

      <GoogleOAuthSettingsComponent />
    </div>
  );
};

export default GoogleOAuthSettings;
