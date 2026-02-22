import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import Layout from '@/components/Layout';
import { toast } from 'sonner';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const email = searchParams.get('email') || '';

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await apiClient.verifyEmail(email, code);
            setVerified(true);
            toast.success('Email verified successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to verify email. Please check the code and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError(null);
        try {
            await apiClient.resendVerification(email);
            toast.success('Verification code resent to your email.');
        } catch (err: any) {
            setError(err.message || 'Failed to resend verification code.');
        } finally {
            setResending(false);
        }
    };

    if (verified) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[70vh] px-4">
                    <Card className="w-full max-w-md border-primary/20 bg-card/60 backdrop-blur-xl shadow-2xl">
                        <CardHeader className="text-center space-y-2">
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-green-500/10 rounded-full">
                                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl font-bold">Email Verified!</CardTitle>
                            <CardDescription className="text-lg">
                                Your account is now active and ready to use.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <Button
                                className="w-full h-12 text-lg bg-primary hover:bg-primary/90 shadow-lg"
                                onClick={() => navigate('/login')}
                            >
                                Continue to Login
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-[70vh] px-4">
                <Card className="w-full max-w-md border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Mail className="h-12 w-12 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold">Verify Your Email</CardTitle>
                        <CardDescription className="text-base">
                            We've sent a 6-digit verification code to <br />
                            <span className="font-bold text-foreground">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        {error && (
                            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    className="h-14 text-center text-3xl font-bold tracking-[0.5em] border-primary/20 focus:border-primary/50"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg bg-primary hover:bg-primary/90 shadow-lg"
                                disabled={loading || code.length !== 6}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : 'Verify Email'}
                            </Button>
                        </form>

                        <div className="text-center pt-2">
                            <p className="text-sm text-muted-foreground mb-3">
                                Didn't receive the code?
                            </p>
                            <Button
                                variant="outline"
                                onClick={handleResend}
                                disabled={resending}
                                className="h-10 hover:bg-secondary/50"
                            >
                                {resending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resending...
                                    </>
                                ) : 'Resend Code'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default VerifyEmail;
