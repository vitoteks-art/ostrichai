import { useBooking } from "@/contexts/BookingContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, MapPin, ArrowLeft, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { format, addDays, startOfDay, parseISO, isBefore, isAfter } from "date-fns";
import { MeetingType, Appointment } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";

export default function PublicBooking() {
  const { meetingTypes, availability, appointments, settings, addAppointment, loading } = useBooking();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<"select-type" | "select-datetime" | "fill-details" | "confirmed">("select-type");
  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const { toast } = useToast();

  // Handle query parameter for pre-selecting meeting type
  useEffect(() => {
    if (loading) return;
    const typeId = searchParams.get("type");
    if (typeId && step === "select-type") {
      const meetingType = meetingTypes.find(mt => mt.id === typeId && mt.active);
      if (meetingType) {
        setSelectedMeetingType(meetingType);
        setStep("select-datetime");
      } else {
        toast({
          title: "Invalid Meeting Type",
          description: "The specified meeting type does not exist or is not active.",
          variant: "destructive",
        });
      }
    }
  }, [searchParams, meetingTypes, step, toast, loading]);

  const activeMeetingTypes = meetingTypes.filter((mt) => mt.active);

  const handleSelectMeetingType = (meetingType: MeetingType) => {
    setSelectedMeetingType(meetingType);
    setStep("select-datetime");
  };

  const getAvailableTimeSlots = (date: Date): string[] => {
    if (!selectedMeetingType) return [];

    const dayName = format(date, "EEEE").toLowerCase() as keyof typeof availability;
    const dayAvailability = availability[dayName];

    if (!dayAvailability.enabled) return [];

    const slots: string[] = [];
    const [startHour, startMinute] = dayAvailability.start.split(":").map(Number);
    const [endHour, endMinute] = dayAvailability.end.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const duration = selectedMeetingType.duration + settings.bufferMinutes;

    for (let minutes = startMinutes; minutes + selectedMeetingType.duration <= endMinutes; minutes += duration) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

      // Check if slot is not already booked
      const isBooked = appointments.some(
        (apt) =>
          apt.status === "confirmed" &&
          apt.date === format(date, "yyyy-MM-dd") &&
          apt.time === timeString
      );

      if (!isBooked) {
        slots.push(timeString);
      }
    }

    return slots;
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = startOfDay(new Date());
    const minDate = addDays(today, 0);
    const maxDate = addDays(today, settings.maxDaysInAdvance);

    if (isBefore(date, minDate) || isAfter(date, maxDate)) return true;

    const dayName = format(date, "EEEE").toLowerCase() as keyof typeof availability;
    return !availability[dayName].enabled;
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep("fill-details");
  };

  const handleSubmit = async () => {
    if (!selectedMeetingType || !selectedDate || !selectedTime) return;

    if (!formData.name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        meetingTypeId: selectedMeetingType.id,
        meetingTypeName: selectedMeetingType.name,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        duration: selectedMeetingType.duration,
        clientName: formData.name,
        clientEmail: formData.email,
        clientPhone: formData.phone,
        notes: formData.notes,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };

      // Add appointment (this will trigger the webhook and return response)
      const response = await addAppointment(newAppointment);

      console.log("📨 Webhook response received:", response);
      setWebhookResponse(response);

      toast({
        title: "Booking Submitted!",
        description: "Your appointment has been scheduled successfully.",
      });

      setStep("confirmed");
    } catch (error) {
      console.error("❌ Booking submission failed:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error submitting your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep("select-type");
    setSelectedMeetingType(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setFormData({ name: "", email: "", phone: "", notes: "" });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <SEO
        title="Book a Meeting | OstrichAi Support & Consultation"
        description="Schedule a consultation or support meeting with the OstrichAi team. Choose a convenient time and connect with our experts."
      />
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <CalendarIcon className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Book an Appointment</h1>
          <p className="text-muted-foreground">
            Schedule a meeting that works for you
          </p>
        </div>

        {step === "select-type" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-6">
              Select a Meeting Type
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {activeMeetingTypes.map((mt) => (
                <Card
                  key={mt.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSelectMeetingType(mt)}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-2 rounded-t-lg"
                    style={{ backgroundColor: mt.color }}
                  />
                  <CardHeader className="pt-6">
                    <CardTitle>{mt.name}</CardTitle>
                    <CardDescription>{mt.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{mt.duration} minutes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{mt.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === "select-datetime" && selectedMeetingType && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("select-type")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>{selectedMeetingType.name}</CardTitle>
                  <CardDescription>Select a date and time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-4 block">Choose a Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={isDateDisabled}
                  className="rounded-md border mx-auto"
                />
              </div>

              {selectedDate && (
                <div>
                  <Label className="text-base font-semibold mb-4 block">
                    Available Times on {format(selectedDate, "MMMM dd, yyyy")}
                  </Label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {getAvailableTimeSlots(selectedDate).map((time) => (
                      <Button
                        key={time}
                        variant="outline"
                        onClick={() => handleSelectTime(time)}
                        className="h-12"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                  {getAvailableTimeSlots(selectedDate).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No available time slots for this date
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "fill-details" && selectedMeetingType && selectedDate && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("select-datetime")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>Your Information</CardTitle>
                  <CardDescription>
                    {selectedMeetingType.name} on {format(selectedDate, "MMMM dd, yyyy")} at{" "}
                    {selectedTime}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anything you'd like us to know before the meeting"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "confirmed" && selectedMeetingType && selectedDate && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-primary/10 p-4">
                  <Check className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-foreground">Booking Confirmed!</h2>
              <p className="text-muted-foreground mb-6">
                Your appointment has been successfully scheduled.
              </p>

              {/* Unified booking summary */}
              <div className="bg-card border rounded-lg p-6 mb-6 text-left max-w-lg mx-auto">
                <h3 className="font-semibold mb-4 text-foreground">📅 Your Appointment Details:</h3>

                {/* Show webhook response data if available */}
                {webhookResponse && Array.isArray(webhookResponse) && webhookResponse[0]?.output ? (
                  <div className="space-y-3 text-sm">
                    {/* Status and message */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-medium ${webhookResponse[0].output.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {webhookResponse[0].output.success ? "✅ Confirmed" : "❌ Failed"}
                      </span>
                    </div>

                    {webhookResponse[0].output.message && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Message:</span>
                        <span className="font-medium text-foreground">
                          {webhookResponse[0].output.message}
                        </span>
                      </div>
                    )}

                    {/* Appointment summary from webhook */}
                    {webhookResponse[0].output.appointmentSummary && (
                      <>
                        <div className="border-t pt-3 mt-3 border-border">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Service:</span>
                              <span className="font-medium text-foreground">{webhookResponse[0].output.appointmentSummary.service}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Date:</span>
                              <span className="font-medium text-foreground">{webhookResponse[0].output.appointmentSummary.date}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Time:</span>
                              <span className="font-medium text-foreground">{webhookResponse[0].output.appointmentSummary.time}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Duration:</span>
                              <span className="font-medium text-foreground">{webhookResponse[0].output.appointmentSummary.duration}</span>
                            </div>

                            {webhookResponse[0].output.appointmentSummary.confirmationId && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Confirmation ID:</span>
                                <span className="font-medium font-mono text-foreground">{webhookResponse[0].output.appointmentSummary.confirmationId}</span>
                              </div>
                            )}

                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Client:</span>
                              <span className="font-medium text-foreground">{webhookResponse[0].output.appointmentSummary.clientName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Email:</span>
                              <span className="font-medium text-foreground">{webhookResponse[0].output.appointmentSummary.clientEmail}</span>
                            </div>
                          </div>
                        </div>

                        {/* Meeting link */}
                        {webhookResponse[0].output.meetingLink && (
                          <div className="border-t pt-3 mt-3 border-border">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Meeting Link:</span>
                              <a
                                href={webhookResponse[0].output.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary hover:underline"
                              >
                                Join Meeting 🔗
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Email status */}
                        {webhookResponse[0].output.emailsSent && (
                          <div className="border-t pt-3 mt-3 border-border">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Email Status:</span>
                              <span className="font-medium text-foreground">
                                Client: {webhookResponse[0].output.emailsSent.client ? "✅ Sent" : "❌ Failed"} |
                                Owner: {webhookResponse[0].output.emailsSent.owner ? "✅ Sent" : "❌ Failed"}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  /* Fallback to original appointment details if no webhook response */
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Meeting Type:</span>
                      <span className="font-medium text-foreground">{selectedMeetingType.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium text-foreground">{format(selectedDate, "MMMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium text-foreground">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium text-foreground">{selectedMeetingType.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium text-foreground">{selectedMeetingType.location}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  A confirmation email will be sent to <strong className="text-foreground">{formData.email}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  📡 Webhook notification sent to your automation system
                </p>
              </div>

              <Button onClick={handleReset} size="lg">
                Book Another Appointment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
