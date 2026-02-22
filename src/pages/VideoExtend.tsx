
import React, { useState } from 'react';
import Layout from "@/components/Layout";
import VideoExtendComponent from "@/components/VideoExtendComponent";
import SEO from "@/components/SEO";

const VideoExtend = () => {
    return (
        <Layout>
            <SEO
                title="AI Video Extension | Seamlessly Extend Your Videos"
                description="Extend your favorite videos effortlessly with AI. Maintain style and continuity while adding more content to your clips."
            />
            <div className="flex min-h-screen w-full">
                <main className="flex-1 overflow-auto">
                    <div className="container mx-auto p-6 md:p-8 max-w-7xl animate-in fade-in duration-500">
                        <VideoExtendComponent
                            apiKey={import.meta.env.VITE_GEMINI_API_KEY || ''}
                            imgbbKey={import.meta.env.VITE_IMGBB_API_KEY || ''}
                        />
                    </div>
                </main>
            </div>
        </Layout>
    );
};

export default VideoExtend;
