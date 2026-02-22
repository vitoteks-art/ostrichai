'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Eye,
  Lock,
  Users,
  Database,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Globe
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

const PrivacyPolicyPage = () => {
  const lastUpdated = "October 29, 2024";

  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      icon: <Info className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            Welcome to OstrichAi ("we," "our," or "us"). This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our Facebook application and related services.
          </p>
          <p>
            By using our Facebook app, you agree to the collection and use of information in accordance with this policy.
            This policy applies specifically to our Facebook application and its integration with Facebook's platform.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Facebook Platform Policy Compliance:</strong> This privacy policy complies with
                  Facebook's Platform Policy and Data Use Policy. We only collect data that Facebook permits
                  and use it in accordance with their guidelines.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "data-collection",
      title: "Information We Collect",
      icon: <Database className="h-6 w-6" />,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-foreground mb-3">Information from Facebook</h4>
            <p className="text-muted-foreground mb-3">
              When you connect your Facebook account to our app, we may collect:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Public profile information (name, profile picture, email)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Page access tokens for managing your Facebook Pages</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Lead information from Facebook Lead Ads</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Messages and conversations (with your explicit consent)</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Information You Provide</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Account registration information</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Business information and preferences</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Communication preferences</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Automatically Collected Information</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Usage data and analytics</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Device information and IP addresses</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Performance metrics and error logs</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "data-usage",
      title: "How We Use Your Information",
      icon: <Eye className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            We use the collected information for the following purposes:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2">Service Delivery</h5>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Process and respond to leads</li>
                <li>• Manage Facebook Page conversations</li>
                <li>• Provide AI-powered responses</li>
                <li>• Generate reports and analytics</li>
              </ul>
            </div>
            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2">Platform Integration</h5>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Connect with Facebook APIs</li>
                <li>• Sync lead data</li>
                <li>• Automate messaging workflows</li>
                <li>• Monitor campaign performance</li>
              </ul>
            </div>
            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2">Communication</h5>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Send service notifications</li>
                <li>• Provide customer support</li>
                <li>• Share important updates</li>
                <li>• Respond to inquiries</li>
              </ul>
            </div>
            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2">Improvement</h5>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Analyze usage patterns</li>
                <li>• Improve AI responses</li>
                <li>• Enhance user experience</li>
                <li>• Develop new features</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "data-sharing",
      title: "Information Sharing and Disclosure",
      icon: <Users className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
          </p>

          <div className="space-y-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-foreground">Service Providers</h5>
                <p className="text-sm text-muted-foreground">
                  We may share information with trusted third-party service providers who assist us in operating our service,
                  conducting our business, or servicing you, as long as those parties agree to keep this information confidential.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Shield className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-foreground">Facebook Platform</h5>
                <p className="text-sm text-muted-foreground">
                  Information collected through Facebook's APIs remains subject to Facebook's Platform Policy.
                  We only use Facebook-provided data in accordance with their terms and our approved use cases.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Shield className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-foreground">Legal Requirements</h5>
                <p className="text-sm text-muted-foreground">
                  We may disclose your information if required to do so by law or in response to valid legal processes,
                  such as a court order, government request, or legal investigation.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Shield className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-foreground">Business Transfers</h5>
                <p className="text-sm text-muted-foreground">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred
                  as part of that transaction, subject to the same privacy protections.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "data-security",
      title: "Data Security",
      icon: <Lock className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            We implement appropriate technical and organizational security measures to protect your personal information:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-green-600" />
                Encryption
              </h5>
              <p className="text-sm text-muted-foreground">
                All data transmission is encrypted using SSL/TLS protocols.
                Sensitive data is encrypted at rest using industry-standard encryption.
              </p>
            </div>

            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-blue-600" />
                Access Controls
              </h5>
              <p className="text-sm text-muted-foreground">
                Strict access controls and authentication mechanisms protect your data.
                Only authorized personnel can access sensitive information.
              </p>
            </div>

            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2 flex items-center">
                <Database className="h-4 w-4 mr-2 text-purple-600" />
                Regular Audits
              </h5>
              <p className="text-sm text-muted-foreground">
                We conduct regular security audits and vulnerability assessments
                to maintain the highest standards of data protection.
              </p>
            </div>

            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                Incident Response
              </h5>
              <p className="text-sm text-muted-foreground">
                We have incident response procedures in place to address any potential
                security breaches and notify affected users promptly.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "user-rights",
      title: "Your Rights and Choices",
      icon: <CheckCircle className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You have certain rights regarding your personal information:
          </p>

          <div className="space-y-4">
            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2">Access and Portability</h5>
              <p className="text-sm text-muted-foreground">
                You can request access to your personal data and obtain a copy in a portable format.
              </p>
            </div>

            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2">Correction and Updates</h5>
              <p className="text-sm text-muted-foreground">
                You can update or correct your personal information at any time through your account settings.
              </p>
            </div>

            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2">Deletion</h5>
              <p className="text-sm text-muted-foreground">
                You can request deletion of your personal data, subject to legal and legitimate business requirements.
              </p>
            </div>

            <div className="bg-card/60 p-4 rounded-lg border border-border/50">
              <h5 className="font-semibold text-foreground mb-2">Withdraw Consent</h5>
              <p className="text-sm text-muted-foreground">
                You can withdraw consent for data processing at any time by disconnecting your Facebook account.
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>Facebook Data:</strong> Some data obtained through Facebook's APIs may be subject to
                  Facebook's retention policies. Disconnecting your account will revoke our access to this data.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "data-retention",
      title: "Data Retention",
      icon: <Calendar className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy:
          </p>

          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span><strong>Account Data:</strong> Retained while your account is active and for a reasonable period after deactivation</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span><strong>Lead Data:</strong> Retained according to your business needs and applicable data protection laws</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span><strong>Analytics Data:</strong> Aggregated and anonymized data may be retained indefinitely for service improvement</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span><strong>Legal Requirements:</strong> Data may be retained longer if required by law or for legal proceedings</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "international-transfers",
      title: "International Data Transfers",
      icon: <Globe className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Your information may be transferred to and processed in countries other than your own.
            We ensure appropriate safeguards are in place for international data transfers:
          </p>

          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span>Compliance with applicable data protection laws</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span>Standard contractual clauses and adequacy decisions</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span>Secure data transmission protocols</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span>Regular audits of data processing partners</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "contact-info",
      title: "Contact Information",
      icon: <Mail className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/50">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-primary" />
                  Email Us
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-muted-foreground mb-2">General inquiries and support:</p>
                <a href="mailto:support@getostrichai.com" className="text-primary hover:text-primary/80 font-medium">
                  support@getostrichai.com
                </a>
              </CardContent>
            </Card>

            <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/50">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-primary" />
                  Call Us
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-muted-foreground mb-2">Direct support line:</p>
                <a href="tel:+2347068430246" className="text-primary hover:text-primary/80 font-medium">
                  +234 706 843 0246
                </a>
              </CardContent>
            </Card>
          </div>

          <div className="bg-card/60 p-6 rounded-lg border border-border/50">
            <h5 className="font-semibold text-foreground mb-3 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              Our Office
            </h5>
            <div className="text-muted-foreground space-y-1">
              <p>OstrichAi (by OstrichAi Limited)</p>
              <p>S7/641 Oshodi Olorunsogo Molete</p>
              <p>Ibadan, Oyo State, Nigeria</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <Layout>
      <SEO
        title="Privacy Policy | Your Data Security at OstrichAi"
        description="Read the Privacy Policy for OstrichAi. Learn how we collect, use, and protect your data with our secure digital solutions."
      />
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto">
          <div className="max-w-screen-xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
              <Shield className="h-4 w-4" />
              <span>Privacy Policy</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Your Privacy
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary block animate-pulse">
                Matters
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              We are committed to protecting your privacy and being transparent about how we handle your data
              in our Facebook application.
            </p>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-12">
              {sections.map((section, index) => (
                <Card key={section.id} id={section.id} className="scroll-mt-24 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center">
                      <div className="bg-primary/10 p-2 rounded-lg mr-3">
                        {section.icon}
                      </div>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {section.content}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Changes Section */}
      <section className="py-20 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Policy Updates</h2>
            <p className="text-xl text-muted-foreground mb-8">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
            </p>

            <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                  <h3 className="text-xl font-bold text-foreground">Important Notice</h3>
                </div>
                <p className="text-muted-foreground">
                  We will notify you of any material changes to this policy by posting the updated version on this page
                  and updating the "Last updated" date. We encourage you to review this policy periodically.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>Current version: 1.0</span>
                  <span>•</span>
                  <span>Last updated: {lastUpdated}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Questions About Your Privacy?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-3xl mx-auto">
            Our team is here to help you understand how we protect your data and your rights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-4 text-lg font-semibold">
                Contact Us
                <Mail className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="mailto:support@getostrichai.com">
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg font-semibold">
                <ExternalLink className="mr-2 h-5 w-5" />
                Email Support
              </Button>
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PrivacyPolicyPage;
