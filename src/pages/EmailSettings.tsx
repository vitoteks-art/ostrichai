import React from 'react';
import { EmailSettings as EmailSettingsComponent } from '../components/EmailSettings';

const EmailSettings: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Email Settings</h1>
        <p className="text-muted-foreground">
          Configure and test Mailtrap integration for Supabase authentication emails
        </p>
      </div>

      <EmailSettingsComponent />
    </div>
  );
};

export default EmailSettings;
