'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle,
  Building2,
  ShoppingCart,
  Heart,
  GraduationCap,
  Plane,
  Home,
  Briefcase,
  Smartphone,
  Car,
  Utensils,
  Gamepad2,
  Music,
  Camera,
  TrendingUp,
  Users,
  Target,
  Zap,
  Shield,
  Clock,
  Star,
  Quote,
  Mail,
  Crown,
  Factory,
  Stethoscope,
  BookOpen,
  Dumbbell,
  Palette,
  Wrench,
  Truck,
  Coffee,
  Shirt,
  Monitor,
  Calculator,
  Gavel,
  TreePine
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

const IndustriesPage = () => {
  const industries = [
    {
      icon: <Building2 className="h-8 w-8 text-blue-600" />,
      title: "IT & Technology",
      description: "Software companies, tech startups, IT consultancies, and digital agencies.",
      features: ["Lead generation for SaaS platforms", "Technical service inquiries", "Partnership opportunities", "Client onboarding"],
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100"
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-green-600" />,
      title: "E-commerce & Retail",
      description: "Online stores, retail chains, marketplaces, and wholesale distributors.",
      features: ["Product inquiry management", "Order status updates", "Customer support automation", "Sales lead qualification"],
      bgColor: "bg-green-50",
      iconBg: "bg-green-100"
    },
    {
      icon: <Heart className="h-8 w-8 text-red-600" />,
      title: "Healthcare & Wellness",
      description: "Hospitals, clinics, private practices, wellness centers, and pharmaceutical companies.",
      features: ["Appointment scheduling", "Patient inquiries", "Service information", "Emergency contact handling"],
      bgColor: "bg-red-50",
      iconBg: "bg-red-100"
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-purple-600" />,
      title: "Education & Training",
      description: "Schools, universities, online courses, training institutes, and educational consultants.",
      features: ["Admission inquiries", "Course information", "Enrollment assistance", "Student support"],
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100"
    },
    {
      icon: <Briefcase className="h-8 w-8 text-indigo-600" />,
      title: "Professional Services",
      description: "Law firms, accounting firms, consultancies, and business service providers.",
      features: ["Client consultation requests", "Service inquiries", "Quote requests", "Meeting scheduling"],
      bgColor: "bg-indigo-50",
      iconBg: "bg-indigo-100"
    },
    {
      icon: <Factory className="h-8 w-8 text-orange-600" />,
      title: "Manufacturing",
      description: "Industrial manufacturers, assembly plants, and production facilities.",
      features: ["Supplier inquiries", "Product specifications", "Bulk order requests", "Technical support"],
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100"
    },
    {
      icon: <Home className="h-8 w-8 text-teal-600" />,
      title: "Real Estate",
      description: "Real estate agencies, property management, construction, and housing services.",
      features: ["Property viewing requests", "Valuation inquiries", "Tenant applications", "Maintenance requests"],
      bgColor: "bg-teal-50",
      iconBg: "bg-teal-100"
    },
    {
      icon: <Car className="h-8 w-8 text-gray-600" />,
      title: "Automotive",
      description: "Car dealerships, auto repair shops, parts suppliers, and transportation services.",
      features: ["Service booking", "Test drive requests", "Parts inquiries", "Fleet management"],
      bgColor: "bg-gray-50",
      iconBg: "bg-gray-100"
    },
    {
      icon: <Utensils className="h-8 w-8 text-amber-600" />,
      title: "Food & Beverage",
      description: "Restaurants, cafes, food delivery, catering services, and beverage companies.",
      features: ["Reservation booking", "Order inquiries", "Catering requests", "Menu information"],
      bgColor: "bg-amber-50",
      iconBg: "bg-amber-100"
    },
    {
      icon: <Dumbbell className="h-8 w-8 text-pink-600" />,
      title: "Fitness & Sports",
      description: "Gyms, sports clubs, fitness trainers, and sports equipment retailers.",
      features: ["Membership inquiries", "Class booking", "Personal training", "Equipment sales"],
      bgColor: "bg-pink-50",
      iconBg: "bg-pink-100"
    },
    {
      icon: <Palette className="h-8 w-8 text-cyan-600" />,
      title: "Creative Industries",
      description: "Design agencies, marketing firms, photographers, and creative studios.",
      features: ["Project inquiries", "Portfolio requests", "Collaboration opportunities", "Quote requests"],
      bgColor: "bg-cyan-50",
      iconBg: "bg-cyan-100"
    },
    {
      icon: <Music className="h-8 w-8 text-violet-600" />,
      title: "Entertainment & Media",
      description: "Event companies, media production, entertainment venues, and content creators.",
      features: ["Event inquiries", "Booking requests", "Content collaboration", "Press inquiries"],
      bgColor: "bg-violet-50",
      iconBg: "bg-violet-100"
    }
  ];

  const benefits = [
    {
      icon: <Clock className="h-6 w-6 text-blue-600" />,
      title: "24/7 Availability",
      description: "Never miss a lead with round-the-clock automated responses that engage prospects instantly."
    },
    {
      icon: <Target className="h-6 w-6 text-green-600" />,
      title: "Qualified Lead Capture",
      description: "Intelligent filtering ensures only high-quality leads reach your sales team."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
      title: "Increased Conversion",
      description: "Fast response times lead to higher conversion rates and better customer satisfaction."
    },
    {
      icon: <Users className="h-6 w-6 text-orange-600" />,
      title: "Better Customer Experience",
      description: "Professional, consistent responses build trust and improve your brand image."
    }
  ];

  const stats = [
    { number: "15+", label: "Industries Served", icon: <Building2 className="h-6 w-6" /> },
    { number: "500+", label: "Businesses Empowered", icon: <Users className="h-6 w-6" /> },
    { number: "60 sec", label: "Average Response Time", icon: <Clock className="h-6 w-6" /> },
    { number: "95%", label: "Lead Capture Rate", icon: <Target className="h-6 w-6" /> }
  ];

  return (
    <Layout>
      <SEO
        title="Industry-Specific AI Solutions | OstrichAi"
        description="AI-powered marketing and lead response tailored for your industry. Discover how OstrichAi helps startups, health, education, and real estate businesses grow."
      />
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-screen-xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
              <Crown className="h-4 w-4" />
              <span>Industries We Serve</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Solutions for Every
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary block animate-pulse">
                Industry
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              From healthcare to e-commerce, manufacturing to creative services – our AI-powered lead response
              solutions adapt to your industry's unique needs and communication patterns.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-screen-xl mx-auto mt-12">
              {stats.map((stat, index) => (
                <div key={index} className="bg-card/60 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:bg-card/80 transition-all duration-300">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4 mx-auto">
                    <div className="text-primary">{stat.icon}</div>
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.number}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Industries We Transform</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our AI solutions are tailored to meet the specific needs and challenges of different industries,
                ensuring maximum effectiveness and ROI for your business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {industries.map((industry, index) => (
                <Card key={index} className="p-8 hover:shadow-lg transition-all duration-300 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 h-full">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className={`${industry.iconBg} p-3 rounded-lg flex-shrink-0`}>
                      {industry.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-3">{industry.title}</h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">{industry.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {industry.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Why Industries Choose Us</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Across all industries, businesses face the same fundamental challenge: responding to leads
                fast enough to convert them into customers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4 p-6 bg-card/60 backdrop-blur-xl rounded-lg border border-border/50 hover:bg-card/80 transition-all duration-300">
                  <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Success Across Industries</h2>
              <p className="text-xl text-muted-foreground">
                See how businesses in different sectors have transformed their lead response process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">E-commerce Success</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    "Our online store was missing 60% of leads due to slow response times. With OstrichAi's AI solution,
                    we now respond instantly and have seen a 150% increase in qualified leads."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary font-bold text-sm">SM</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Sarah Martinez</div>
                      <div className="text-sm text-muted-foreground">E-commerce Director</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/80 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Healthcare Transformation</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    "Patient inquiries used to pile up during busy hours. Now our AI handles initial consultations
                    24/7, improving patient satisfaction and allowing our staff to focus on care delivery."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary font-bold text-sm">DR</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Dr. James Rodriguez</div>
                      <div className="text-sm text-muted-foreground">Practice Manager</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-screen-xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Ready to Transform Your Industry?</h2>
            <p className="text-xl text-muted-foreground mb-12">
              Join hundreds of businesses across different industries who trust OstrichAi to never miss another lead.
            </p>

            <Card className="p-8 bg-card/60 backdrop-blur-xl border-border/50 shadow-2xl">
              <h3 className="text-3xl font-bold mb-4 text-foreground">Get Started Today</h3>
              <p className="text-xl mb-6 text-muted-foreground">
                See how our AI-powered lead response solutions can transform your business,
                regardless of your industry.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Schedule Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button size="lg" variant="outline" className="border-border hover:bg-secondary/80">
                    View Our Services
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default IndustriesPage;
