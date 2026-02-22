export interface MeetingType {
  id: string;
  name: string;
  duration: number;
  description: string;
  location: string;
  active: boolean;
  color: string;
}

export interface DayAvailability {
  enabled: boolean;
  start: string;
  end: string;
}

export interface Availability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface Appointment {
  id: string;
  meetingTypeId: string;
  meetingTypeName: string;
  date: string;
  time: string;
  duration: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

export interface BookingSettings {
  minNoticeHours: number;
  maxDaysInAdvance: number;
  bufferMinutes: number;
  n8nWebhookUrl?: string;
}
