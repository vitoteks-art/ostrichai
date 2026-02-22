'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Star,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Target,
  Award,
  Rocket,
  Building,
  DollarSign,
  Globe,
  Bot,
  BarChart3,
  Smartphone,
  Send,
  User,
  Briefcase,
  Lightbulb,
  MessageCircle
} from 'lucide-react';
import Layout from '@/components/Layout';

interface ServicesFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  industry: string;
  jobRole: string;
  companySize: string;
  currentChallenges: string;
  interestedServices: string[];
  budget: string;
  timeline: string;
  projectDescription: string;
  successMetrics: string;
  additionalInfo: string;
}

const ServicesRequestPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ServicesFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    industry: '',
    jobRole: '',
    companySize: '',
    currentChallenges: '',
    interestedServices: [],
    budget: '',
    timeline: '',
    projectDescription: '',
    successMetrics: '',
    additionalInfo: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      interestedServices: prev.interestedServices.includes(service)
        ? prev.interestedServices.filter(s => s !== service)
        : [...prev.interestedServices, service]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.company || !formData.interestedServices.length) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send to n8n webhook
      const response = await fetch('https://n8n.getostrichai.com/webhook/services-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
          source: 'services-request-page'
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('There was an error submitting your request. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    {
      id: 'web-design',
      name: 'Custom Web Design',
      icon: <Globe className="h-5 w-5" />,
      description: 'Professional, responsive websites that convert'
    },
    {
      id: 'ai-automation',
      name: 'AI Business Automation',
      icon: <Bot className="h-5 w-5" />,
      description: 'OstrichAi and workflow automation'
    },
    {
      id: 'lead-generation',
      name: 'Lead Generation',
      icon: <Target className="h-5 w-5" />,
      description: 'Advanced lead generation and qualification'
    },
    {
      id: 'dashboard-analytics',
      name: 'Business Intelligence',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Real-time analytics and insights'
    },
    {
      id: 'digital-marketing',
      name: 'Digital Marketing',
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Comprehensive digital marketing campaigns'
    },
    {
      id: 'mobile-apps',
      name: 'Mobile App Development',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'Native and cross-platform mobile apps'
    }
  ];

  if (isSubmitted) {
    return (
      <Layout>
        <section className="py-24 px-4 bg-secondary/5">
          <div className="container mx-auto">
            <div className="max-w-screen-xl mx-auto text-center">
              <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-8 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Request Received!
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Thank you for your interest in OstrichAi's professional services. Our team will get back to you within 2 hours during business hours.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-screen-xl mx-auto">
                <Card className="p-8 text-center bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Quick Response</h3>
                  <p className="text-sm text-muted-foreground">We'll respond within 2 hours during business hours</p>
                </Card>

                <Card className="p-8 text-center bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <User className="h-8 w-8 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Personal Touch</h3>
                  <p className="text-sm text-muted-foreground">A real person will review and respond to your inquiry</p>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button variant="outline" size="lg" className="border-border hover:bg-secondary/80">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <Link to="/services">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Briefcase className="h-4 w-4 mr-2" />
                    View Our Services
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto">
          <div className="max-w-screen-xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
              <Briefcase className="h-4 w-4" />
              <span>Professional Services</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Request Our Professional
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary block animate-pulse">
                Services
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              Get a custom solution tailored to your business needs. From AI automation to custom web development,
              we'll help you achieve your goals faster.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-screen-xl mx-auto">
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:bg-card/80 transition-all duration-300">
                <Clock className="h-6 w-6 text-blue-600 mb-3 mx-auto" />
                <div className="text-lg font-bold text-foreground mb-1">48 Hours</div>
                <div className="text-muted-foreground text-sm">Average Setup</div>
              </div>
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:bg-card/80 transition-all duration-300">
                <Shield className="h-6 w-6 text-green-600 mb-3 mx-auto" />
                <div className="text-lg font-bold text-foreground mb-1">Custom</div>
                <div className="text-muted-foreground text-sm">Solutions</div>
              </div>
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:bg-card/80 transition-all duration-300">
                <Award className="h-6 w-6 text-purple-600 mb-3 mx-auto" />
                <div className="text-lg font-bold text-foreground mb-1">Performance</div>
                <div className="text-muted-foreground text-sm">Guarantee</div>
              </div>
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:bg-card/80 transition-all duration-300">
                <Users className="h-6 w-6 text-orange-600 mb-3 mx-auto" />
                <div className="text-lg font-bold text-foreground mb-1">24/7</div>
                <div className="text-muted-foreground text-sm">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Form */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-2 border-primary/20 bg-card/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center">
                      <Send className="h-6 w-6 mr-2 text-primary" />
                      Service Request Form
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center">
                          <User className="h-5 w-5 mr-2 text-blue-600" />
                          Contact Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              placeholder="John"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              placeholder="Smith"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Business Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="john@company.com"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              placeholder="+234 706 843 0246"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Company Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center">
                          <Building className="h-5 w-5 mr-2 text-green-600" />
                          Company Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="company">Company Name *</Label>
                            <Input
                              id="company"
                              value={formData.company}
                              onChange={(e) => handleInputChange('company', e.target.value)}
                              placeholder="Your Company Inc."
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="website">Website URL</Label>
                            <Input
                              id="website"
                              type="url"
                              value={formData.website}
                              onChange={(e) => handleInputChange('website', e.target.value)}
                              placeholder="https://yourcompany.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your industry" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="real-estate">Real Estate</SelectItem>
                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="consulting">Consulting</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="companySize">Company Size</Label>
                            <Select value={formData.companySize} onValueChange={(value) => handleInputChange('companySize', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select company size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-10">1-10 employees</SelectItem>
                                <SelectItem value="11-50">11-50 employees</SelectItem>
                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                <SelectItem value="201-1000">201-1000 employees</SelectItem>
                                <SelectItem value="1000+">1000+ employees</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="jobRole">Your Role</Label>
                          <Select value={formData.jobRole} onValueChange={(value) => handleInputChange('jobRole', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ceo">CEO/Founder</SelectItem>
                              <SelectItem value="cto">CTO/Technical Director</SelectItem>
                              <SelectItem value="cmo">CMO/Marketing Director</SelectItem>
                              <SelectItem value="sales-director">Sales Director</SelectItem>
                              <SelectItem value="operations">Operations Manager</SelectItem>
                              <SelectItem value="business-owner">Business Owner</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      {/* Services Selection */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center">
                          <Briefcase className="h-5 w-5 mr-2 text-purple-600" />
                          Services Interested In *
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {services.map((service) => (
                            <div
                              key={service.id}
                              onClick={() => handleServiceToggle(service.id)}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.interestedServices.includes(service.id)
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-border/80'
                                }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${formData.interestedServices.includes(service.id)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-muted-foreground'
                                  }`}>
                                  {service.icon}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{service.name}</div>
                                  <div className="text-xs text-muted-foreground">{service.description}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Project Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center">
                          <Target className="h-5 w-5 mr-2 text-orange-600" />
                          Project Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="budget">Project Budget</Label>
                            <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select budget range" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="under-5k">Under $5,000</SelectItem>
                                <SelectItem value="5k-15k">$5,000 - $15,000</SelectItem>
                                <SelectItem value="15k-30k">$15,000 - $30,000</SelectItem>
                                <SelectItem value="30k-50k">$30,000 - $50,000</SelectItem>
                                <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                                <SelectItem value="100k-plus">$100,000+</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="timeline">Preferred Timeline</Label>
                            <Select value={formData.timeline} onValueChange={(value) => handleInputChange('timeline', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timeline" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="asap">ASAP (Rush project)</SelectItem>
                                <SelectItem value="1-2weeks">1-2 weeks</SelectItem>
                                <SelectItem value="1month">Within a month</SelectItem>
                                <SelectItem value="2-3months">2-3 months</SelectItem>
                                <SelectItem value="flexible">Flexible timeline</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="projectDescription">Project Description</Label>
                          <Textarea
                            id="projectDescription"
                            value={formData.projectDescription}
                            onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                            placeholder="Describe your project goals, requirements, and what you want to achieve..."
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currentChallenges">Current Challenges</Label>
                          <Textarea
                            id="currentChallenges"
                            value={formData.currentChallenges}
                            onChange={(e) => handleInputChange('currentChallenges', e.target.value)}
                            placeholder="What challenges are you currently facing that this project will solve?"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="successMetrics">Success Metrics</Label>
                          <Textarea
                            id="successMetrics"
                            value={formData.successMetrics}
                            onChange={(e) => handleInputChange('successMetrics', e.target.value)}
                            placeholder="How will you measure the success of this project? (KPIs, goals, etc.)"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="additionalInfo">Additional Information</Label>
                          <Textarea
                            id="additionalInfo"
                            value={formData.additionalInfo}
                            onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                            placeholder="Any additional information, special requirements, or questions..."
                            rows={3}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
                        <Send className="ml-2 h-5 w-5" />
                      </Button>

                      <p className="text-sm text-muted-foreground text-center">
                        By submitting this form, you agree to our terms of service and privacy policy.
                        <br />
                        <strong>We'll contact you within 2 hours with a custom proposal.</strong>
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Benefits & Information */}
              <div className="space-y-8">

                {/* Why Choose Us */}
                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                    <Award className="h-6 w-6 mr-2 text-primary" />
                    Why Choose OstrichAi?
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 border border-border/30 rounded-lg hover:shadow-md transition-shadow bg-card/40">
                      <div className="flex items-start space-x-4">
                        <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">Custom Solutions</h4>
                          <p className="text-muted-foreground text-sm">Every project is tailored to your specific business needs</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border border-border/30 rounded-lg hover:shadow-md transition-shadow bg-card/40">
                      <div className="flex items-start space-x-4">
                        <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">Expert Team</h4>
                          <p className="text-muted-foreground text-sm">10+ years experience in web development and AI automation</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border border-border/30 rounded-lg hover:shadow-md transition-shadow bg-card/40">
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                          <Zap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">Fast Delivery</h4>
                          <p className="text-muted-foreground text-sm">Most projects completed within 48 hours to 4 weeks</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h3 className="text-xl font-bold text-foreground mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link to="/revenue-audit">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground justify-start">
                        <Target className="h-4 w-4 mr-2" />
                        Get Revenue Audit
                      </Button>
                    </Link>
                    <a href="tel:+2347068430246">
                      <Button variant="outline" className="w-full justify-start border-border hover:bg-secondary/80">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Us Directly
                      </Button>
                    </a>
                    <a href="https://wa.me/2347068430246" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full justify-start border-border hover:bg-secondary/80">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp Support
                      </Button>
                    </a>
                  </div>
                </Card>

                {/* Response Guarantee */}
                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h3 className="text-xl font-bold text-foreground mb-4">Response Guarantee</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm">2-hour response during business hours</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-primary mr-3" />
                      <span className="text-sm">Custom solutions for your business</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="text-sm">Performance guarantee included</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ServicesRequestPage;
