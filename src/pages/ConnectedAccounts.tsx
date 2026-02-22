import React from 'react';
import { Link } from 'react-router-dom';
import SocialAccountsManager from '@/components/SocialAccountsManager';
import { Home, ChevronRight, Share2 } from 'lucide-react';

const ConnectedAccounts: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
                <Link to="/" className="hover:text-foreground transition-colors flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    Home
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link to="/social-dashboard" className="hover:text-foreground transition-colors">
                    Social Dashboard
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium">Connected Accounts</span>
            </div>

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Share2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Social Media Accounts</h1>
                        <p className="text-muted-foreground">Connect and manage your social media platforms</p>
                    </div>
                </div>
            </div>

            {/* Social Accounts Manager */}
            <SocialAccountsManager />
        </div>
    );
};

export default ConnectedAccounts;
