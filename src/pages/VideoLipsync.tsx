import { VideoLipsyncForm } from "@/components/VideoLipsyncForm";
import Layout from "@/components/Layout";
import { FeatureGate } from "@/components/FeatureGate";
import { Video, Play, Sparkles, Zap, Clock, Shield, ArrowRight, Upload, Settings, Download, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";

const VideoLipsync = () => {
    const videoFeatures = [
        {
            icon: Upload,
            title: "Easy Upload",
            description: "Upload your image and audio file to get started"
        },
        {
            icon: Mic,
            title: "Perfect Sync",
            description: "AI synchronizes lip movements with your audio perfectly"
        },
        {
            icon: Download,
            title: "Quick Export",
            description: "Download your generated video in seconds"
        }
    ];

    return (
        <Layout>
            <SEO
                title="AI Video Lipsync | Synchronized Voice & Facial Animation"
                description="Bring static images to life with AI lipsync technology. Synchronize speech and facial movements perfectly with any audio track."
            />
            <div className="container mx-auto px-4">
                {/* Hero Section */}
                <section className="relative py-24 px-4">
                    <div className="container mx-auto text-center">
                        <div className="max-w-screen-xl mx-auto">
                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
                                <Video className="h-4 w-4" />
                                <span>AI Video Lipsync</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                                Bring Images to Life with
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent block">
                                    AI Lipsync
                                </span>
                            </h1>
                            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                                Transform static portraits into talking videos using advanced AI lipsync technology.
                                Perfect for content creation, presentations, and more.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Video Generation Form */}
                <section className="mb-20">
                    <FeatureGate feature="videoGeneration">
                        <VideoLipsyncForm />
                    </FeatureGate>
                </section>

                {/* Features */}
                <section className="py-20 px-4">
                    <div className="container mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                                How It Works
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Create professional talking head videos in three simple steps
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                            {videoFeatures.map((feature, index) => (
                                <div key={index} className="text-center group p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                                    <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                                        <feature.icon className="h-10 w-10 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default VideoLipsync;
