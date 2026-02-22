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
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Calendar,
  Users,
  Headphones,
  Send,
  CheckCircle,
  Globe,
  Zap,
  Shield,
  Award,
  Building,
  User,
  HelpCircle
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  inquiryType: string;
  subject: string;
  message: string;
  urgency: string;
  preferredContact: string;
}

const ContactPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    inquiryType: '',
    subject: '',
    message: '',
    urgency: '',
    preferredContact: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send to n8n webhook
      const response = await fetch('https://n8n.getostrichai.com/webhook/contact-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
          source: 'contact-page'
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('There was an error submitting your message. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email Us",
      description: "Get a response within 2 hours",
      contact: "support@getostrichai.com",
      action: "mailto:support@getostrichai.com",
      color: "blue"
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Call Us",
      description: "Speak with our team directly",
      contact: "+2347068430246",
      action: "tel:+2347068430246",
      color: "green"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Live Chat",
      description: "Instant support via WhatsApp",
      contact: "Chat Now",
      action: "https://wa.me/2347068430246",
      color: "purple"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Schedule a Call",
      description: "Book a personalized demo",
      contact: "Book Meeting",
      action: "#",
      color: "orange"
    }
  ];

  const officeLocation = {
    city: "Ibadan Office",
    address: "S7/641 Oshodi Olorunsogo Molete",
    zipCode: "Ibadan, Oyo State, Nigeria",
    phone: "+2347068430246",
    hours: "Mon-Fri: 9AM-6PM WAT"
  };

  const supportOptions = [
    {
      icon: <Headphones className="h-8 w-8 text-blue-600" />,
      title: "Technical Support",
      description: "Get help with implementation, integrations, and troubleshooting",
      availability: "24/7 Support",
      responseTime: "< 1 hour"
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "Sales Consultation",
      description: "Discuss pricing, features, and find the right plan for your business",
      availability: "Business Hours",
      responseTime: "< 30 minutes"
    },
    {
      icon: <Award className="h-8 w-8 text-purple-600" />,
      title: "Success Management",
      description: "Optimize your setup and maximize ROI with our experts",
      availability: "Dedicated Manager",
      responseTime: "Same Day"
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
                Message Received!
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Thank you for contacting OstrichAi. Our team will get back to you within 2 hours during business hours.
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
                <Link to="/free-trial">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    Get Started
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
      <SEO
        title="Contact Us | Get in Touch with OstrichAi"
        description="Have questions about our AI-powered lead response system? Contact the OstrichAi team today for sales, support, or a personalized demo."
      />
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto">
          <div className="max-w-screen-xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
              <MessageSquare className="h-4 w-4" />
              <span>We're Here to Help</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Get in
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary block animate-pulse">
                Touch
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              Ready to transform your lead response? Have questions about our OstrichAi system?
              Our team is here to help you succeed.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-screen-xl mx-auto">
              {contactMethods.map((method, index) => (
                <a
                  key={index}
                  href={method.action}
                  target={method.action.startsWith('http') ? '_blank' : '_self'}
                  className="bg-card/60 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:bg-card/80 transition-all duration-300 group"
                >
                  <div className="text-primary mb-3 flex justify-center group-hover:scale-110 transition-transform">
                    {method.icon}
                  </div>
                  <div className="text-lg font-bold text-foreground mb-1">{method.title}</div>
                  <div className="text-muted-foreground text-sm">{method.description}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Send Us a Message</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Fill out the form below and we'll get back to you within 2 hours during business hours.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card className="shadow-lg border-2 border-primary/20 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center">
                    <Send className="h-6 w-6 mr-2 text-primary" />
                    Contact Form
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
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
                        <Label htmlFor="email">Email Address *</Label>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          placeholder="Your Company Inc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          value={formData.jobTitle}
                          onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                          placeholder="CEO, Sales Manager, etc."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inquiryType">Inquiry Type</Label>
                        <Select value={formData.inquiryType} onValueChange={(value) => handleInputChange('inquiryType', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select inquiry type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sales">Sales Inquiry</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="demo">Request Demo</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="billing">Billing Question</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="urgency">Urgency Level</Label>
                        <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - General inquiry</SelectItem>
                            <SelectItem value="medium">Medium - Need response soon</SelectItem>
                            <SelectItem value="high">High - Urgent matter</SelectItem>
                            <SelectItem value="critical">Critical - Immediate attention</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="Brief description of your inquiry"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Please provide details about your inquiry, questions, or how we can help you..."
                        rows={6}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                      <Select value={formData.preferredContact} onValueChange={(value) => handleInputChange('preferredContact', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="How would you like us to respond?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="any">Any method is fine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending Message...' : 'Send Message'}
                      <Send className="ml-2 h-5 w-5" />
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      We typically respond within 2 hours during business hours.
                      <br />
                      For urgent matters, please call us directly.
                    </p>
                  </form>
                </CardContent>
              </Card>

              {/* Support Options */}
              <div className="space-y-8">
                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                    <HelpCircle className="h-6 w-6 mr-2 text-primary" />
                    How Can We Help?
                  </h3>
                  <div className="space-y-4">
                    {supportOptions.map((option, index) => (
                      <div key={index} className="p-4 border border-border/30 rounded-lg hover:shadow-md transition-shadow bg-card/40">
                        <div className="flex items-start space-x-4">
                          <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">{option.title}</h4>
                            <p className="text-muted-foreground text-sm mb-2">{option.description}</p>
                            <div className="flex items-center space-x-4 text-xs">
                              <span className="text-green-600 font-medium">{option.availability}</span>
                              <span className="text-primary">{option.responseTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h3 className="text-xl font-bold text-foreground mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link to="/free-trial">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Get Started
                      </Button>
                    </Link>
                    <Link to="/revenue-audit">
                      <Button variant="outline" className="w-full justify-start border-border hover:bg-secondary/80">
                        <Award className="h-4 w-4 mr-2" />
                        Get Revenue Audit
                      </Button>
                    </Link>
                    <a href="https://wa.me/2347068430246" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full justify-start border-border hover:bg-secondary/80">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        WhatsApp Support
                      </Button>
                    </a>
                  </div>
                </Card>

                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h3 className="text-xl font-bold text-foreground mb-4">Response Guarantee</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm">2-hour response during business hours</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-primary mr-3" />
                      <span className="text-sm">24/7 emergency support available</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="text-sm">Real humans, not chatbots</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Office Location */}
      <section className="py-20 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Our Office</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Visit us in person or reach out to our office for local support.
              </p>
            </div>

            <div className="flex justify-center">
              <Card className="p-8 hover:shadow-lg transition-shadow max-w-md w-full bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80">
                <div className="text-center mb-6">
                  <div className="bg-primary/10 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Building className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{officeLocation.city}</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-foreground font-medium">{officeLocation.address}</div>
                      <div className="text-muted-foreground">{officeLocation.zipCode}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                    <a href={`tel:${officeLocation.phone}`} className="text-primary hover:text-primary/80 font-medium">
                      {officeLocation.phone}
                    </a>
                  </div>

                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                    <span className="text-muted-foreground">{officeLocation.hours}</span>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <a href={`tel:${officeLocation.phone}`}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Our Office
                    </Button>
                  </a>
                  <a href="https://wa.me/2347068430246" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full border-border hover:bg-secondary/80">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      WhatsApp Us
                    </Button>
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-muted-foreground">
                Quick answers to common questions. Can't find what you're looking for? Contact us!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h4 className="font-semibold text-foreground mb-2">How quickly do you respond?</h4>
                  <p className="text-muted-foreground text-sm">
                    We respond to all inquiries within 2 hours during business hours (9AM-6PM WAT).
                    For urgent matters, we offer 24/7 emergency support.
                  </p>
                </Card>

                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h4 className="font-semibold text-foreground mb-2">Can I schedule a demo?</h4>
                  <p className="text-muted-foreground text-sm">
                    Absolutely! Use our contact form and select "Request Demo" or call us directly.
                    We'll schedule a personalized demo at your convenience.
                  </p>
                </Card>

                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h4 className="font-semibold text-foreground mb-2">Do you offer technical support?</h4>
                  <p className="text-muted-foreground text-sm">
                    Yes, we provide 24/7 technical support for all our clients. Our team can help with
                    implementation, integrations, and troubleshooting.
                  </p>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h4 className="font-semibold text-foreground mb-2">What's the best way to reach you?</h4>
                  <p className="text-muted-foreground text-sm">
                    For general inquiries, use our contact form or email. For urgent matters, call us directly.
                    For quick questions, our WhatsApp support is very responsive.
                  </p>
                </Card>

                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h4 className="font-semibold text-foreground mb-2">Do you provide local support?</h4>
                  <p className="text-muted-foreground text-sm">
                    Yes! Our office is located in Ibadan, Nigeria, and we provide dedicated support
                    for businesses across West Africa and globally.
                  </p>
                </Card>

                <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                  <h4 className="font-semibold text-foreground mb-2">Can I visit your office?</h4>
                  <p className="text-muted-foreground text-sm">
                    We'd love to meet you! Please contact us in advance to schedule a visit to our
                    Ibadan office. We'll arrange a tour and meeting with our team.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-3xl mx-auto">
            Don't wait for leads to go cold. Contact us today and start capturing more revenue tomorrow.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/free-trial">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-4 text-lg font-semibold">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="tel:+2347068430246">
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg font-semibold">
                <Phone className="mr-2 h-5 w-5" />
                Call Now
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-primary-foreground/80">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              2-hour response guarantee
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              24/7 emergency support
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Local Nigerian support
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ContactPage;
