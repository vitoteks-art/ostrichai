import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, TrendingUp, Users, DollarSign, Clock, Target, Building, Phone, Mail, User } from 'lucide-react';
import { AuditData } from '@/pages/RevenueAudit';

interface RevenueAuditFormProps {
  onSubmit: (data: AuditData) => void;
}

const RevenueAuditForm: React.FC<RevenueAuditFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Partial<AuditData>>({
    leadSources: []
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const industries = [
    'Technology',
    'Healthcare',
    'Financial Services',
    'Real Estate',
    'Manufacturing',
    'Retail',
    'Professional Services',
    'Education',
    'Non-profit',
    'Other'
  ];

  const crmSystems = [
    'Salesforce',
    'HubSpot',
    'Pipedrive',
    'Zoho CRM',
    'Microsoft Dynamics',
    'Freshworks',
    'Monday.com',
    'Notion',
    'Google Workspace',
    'Other',
    'None'
  ];

  const leadSources = [
    'Website Forms',
    'Social Media',
    'Google Ads',
    'Facebook Ads',
    'LinkedIn Ads',
    'Email Marketing',
    'Referrals',
    'Cold Outreach',
    'Events',
    'Other'
  ];

  const challenges = [
    'Slow lead response times',
    'Inconsistent lead qualification',
    'High volume of unqualified leads',
    'Poor lead follow-up',
    'Sales team overwhelmed',
    'Inconsistent messaging',
    'No lead scoring system',
    'Manual data entry',
    'Integration issues',
    'Other'
  ];

  const handleInputChange = (field: keyof AuditData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactInfoChange = (field: keyof AuditData['contactInfo'], value: string) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo!,
        [field]: value
      }
    }));
  };

  const handleLeadSourceChange = (source: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      leadSources: checked
        ? [...(prev.leadSources || []), source]
        : (prev.leadSources || []).filter(s => s !== source)
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.companyName && formData.industry && formData.contactInfo?.name && formData.contactInfo?.email);
      case 2:
        return !!(formData.monthlyLeads && formData.avgDealValue && formData.currentResponseTime);
      case 3:
        return !!(formData.leadSources && formData.leadSources.length > 0 && formData.salesTeamSize && formData.crmSystem);
      case 4:
        return !!(formData.currentConversionRate && formData.biggestChallenge);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(currentStep) && currentStep === totalSteps) {
      onSubmit(formData as AuditData);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step === currentStep
              ? 'bg-primary text-primary-foreground'
              : step < currentStep
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
          }`}>
            {step < currentStep ? '✓' : step}
          </div>
          {step < totalSteps && (
            <div className={`w-12 h-1 mx-2 ${
              step < currentStep ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/20 to-background relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--primary))_1px,transparent_0)] bg-[length:24px_24px]"></div>
      </div>
      <div className="relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/90 backdrop-blur-xl border-border/50 shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                Revenue Audit Assessment
              </CardTitle>
              <p className="text-muted-foreground">
                Help us understand your business to provide personalized insights
              </p>
              {renderStepIndicator()}
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="bg-primary/10 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Building className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Basic Information</h3>
                      <p className="text-muted-foreground">Tell us about your company</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
                          Company Name *
                        </Label>
                        <Input
                          id="companyName"
                          type="text"
                          placeholder="Your Company Name"
                          value={formData.companyName || ''}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          className="bg-input border-border/50 focus:border-primary"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="industry" className="text-sm font-medium text-foreground">
                          Industry *
                        </Label>
                        <Select
                          value={formData.industry || ''}
                          onValueChange={(value) => handleInputChange('industry', value)}
                        >
                          <SelectTrigger className="bg-input border-border focus:border-primary">
                            <SelectValue placeholder="Select your industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((industry) => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactName" className="text-sm font-medium text-foreground">
                          Your Name *
                        </Label>
                        <Input
                          id="contactName"
                          type="text"
                          placeholder="Full Name"
                          value={formData.contactInfo?.name || ''}
                          onChange={(e) => handleContactInfoChange('name', e.target.value)}
                          className="bg-input border-border/50 focus:border-primary"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="text-sm font-medium text-foreground">
                          Email Address *
                        </Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.contactInfo?.email || ''}
                          onChange={(e) => handleContactInfoChange('email', e.target.value)}
                          className="bg-input border-border focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="text-sm font-medium text-foreground">
                        Phone Number
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.contactInfo?.phone || ''}
                        onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                        className="bg-input border-border focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Business Metrics */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="bg-primary/10 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Business Metrics</h3>
                      <p className="text-muted-foreground">Share your current performance data</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="monthlyLeads" className="text-sm font-medium text-foreground">
                          Monthly Leads *
                        </Label>
                        <Input
                          id="monthlyLeads"
                          type="number"
                          placeholder="100"
                          value={formData.monthlyLeads || ''}
                          onChange={(e) => handleInputChange('monthlyLeads', parseInt(e.target.value))}
                          className="bg-input border-border/50 focus:border-primary"
                          min="1"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avgDealValue" className="text-sm font-medium text-foreground">
                          Average Deal Value ($) *
                        </Label>
                        <Input
                          id="avgDealValue"
                          type="number"
                          placeholder="5000"
                          value={formData.avgDealValue || ''}
                          onChange={(e) => handleInputChange('avgDealValue', parseInt(e.target.value))}
                          className="bg-input border-border/50 focus:border-primary"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentResponseTime" className="text-sm font-medium text-foreground">
                        Current Average Response Time (hours) *
                      </Label>
                      <Input
                        id="currentResponseTime"
                        type="number"
                        placeholder="24"
                        value={formData.currentResponseTime || ''}
                        onChange={(e) => handleInputChange('currentResponseTime', parseInt(e.target.value))}
                        className="bg-input border-border/50 focus:border-primary"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Lead Management */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="bg-primary/10 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Lead Management</h3>
                      <p className="text-muted-foreground">How do you currently manage leads?</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-foreground mb-3 block">
                          Lead Sources (select all that apply) *
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          {leadSources.map((source) => (
                            <div key={source} className="flex items-center space-x-2">
                              <Checkbox
                                id={source}
                                checked={(formData.leadSources || []).includes(source)}
                                onCheckedChange={(checked) => handleLeadSourceChange(source, checked as boolean)}
                              />
                              <Label htmlFor={source} className="text-sm text-foreground">
                                {source}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="salesTeamSize" className="text-sm font-medium text-foreground">
                            Sales Team Size *
                          </Label>
                          <Input
                            id="salesTeamSize"
                            type="number"
                            placeholder="5"
                            value={formData.salesTeamSize || ''}
                            onChange={(e) => handleInputChange('salesTeamSize', parseInt(e.target.value))}
                            className="bg-input border-border/50 focus:border-primary"
                            min="1"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="crmSystem" className="text-sm font-medium text-foreground">
                            CRM System *
                          </Label>
                          <Select
                            value={formData.crmSystem || ''}
                            onValueChange={(value) => handleInputChange('crmSystem', value)}
                          >
                            <SelectTrigger className="bg-input border-border focus:border-primary">
                              <SelectValue placeholder="Select CRM system" />
                            </SelectTrigger>
                            <SelectContent>
                              {crmSystems.map((crm) => (
                                <SelectItem key={crm} value={crm}>
                                  {crm}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Current Performance */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="bg-primary/10 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Target className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Current Performance</h3>
                      <p className="text-muted-foreground">Help us understand your current challenges</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentConversionRate" className="text-sm font-medium text-foreground">
                        Current Conversion Rate (%) *
                      </Label>
                      <Input
                        id="currentConversionRate"
                        type="number"
                        placeholder="2.5"
                        value={formData.currentConversionRate || ''}
                        onChange={(e) => handleInputChange('currentConversionRate', parseFloat(e.target.value))}
                        className="bg-input border-border/50 focus:border-primary"
                        min="0"
                        max="100"
                        step="0.1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">
                        Biggest Challenge *
                      </Label>
                      <Select
                        value={formData.biggestChallenge || ''}
                        onValueChange={(value) => handleInputChange('biggestChallenge', value)}
                      >
                        <SelectTrigger className="bg-input border-border/50 focus:border-primary">
                          <SelectValue placeholder="Select your biggest challenge" />
                        </SelectTrigger>
                        <SelectContent>
                          {challenges.map((challenge) => (
                            <SelectItem key={challenge} value={challenge}>
                              {challenge}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="px-6"
                  >
                    Previous
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!validateStep(currentStep)}
                      className="px-6 bg-primary hover:bg-primary/90"
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!validateStep(currentStep)}
                      className="px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      Generate Audit Report
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </section>
  );
};

export default RevenueAuditForm;
