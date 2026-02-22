import React from 'react';
import SocialPostGenerator from '@/components/SocialPostGenerator';
import PostHistory from '@/components/PostHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, History } from 'lucide-react';

const SocialContent: React.FC = () => {
    return (
        <div className="space-y-6">
            <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="create" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Create Post
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Post History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Social Media Post</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SocialPostGenerator />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <PostHistory />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SocialContent;
