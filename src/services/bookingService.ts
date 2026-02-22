import { apiClient } from '@/lib/api';
import { MeetingType, Availability, Appointment, BookingSettings } from '@/types/booking';

export interface DatabaseAppointment {
  id: string;
  meeting_type_id: string;
  meeting_type_name: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  notes: string | null;
  status: string;
  date: string;
  time: string;
  duration: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface DatabaseMeetingType {
  id: string;
  name: string;
  duration: number;
  description: string | null;
  location: string | null;
  active: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseAvailability {
  id: string;
  user_id: string;
  day_of_week: string;
  enabled: boolean;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBookingSettings {
  id: string;
  user_id: string;
  min_notice_hours: number;
  max_days_in_advance: number;
  buffer_minutes: number;
  n8n_webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

class BookingService {
  // Meeting Types
  async getMeetingTypes(): Promise<MeetingType[]> {
    try {
      const data = await apiClient.getMeetingTypes();
      return data.map((item: any) => this.transformMeetingType(item));
    } catch (error) {
      console.error('Error fetching meeting types:', error);
      throw error;
    }
  }

  async createMeetingType(meetingType: Omit<MeetingType, 'id'>): Promise<MeetingType> {
    try {
      const data = await apiClient.createMeetingType({
        name: meetingType.name,
        duration: meetingType.duration,
        description: meetingType.description,
        location: meetingType.location,
        active: meetingType.active,
        color: meetingType.color,
      });
      return this.transformMeetingType(data);
    } catch (error) {
      console.error('Error creating meeting type:', error);
      throw error;
    }
  }

  async updateMeetingType(id: string, updates: Partial<MeetingType>): Promise<MeetingType> {
    try {
      const data = await apiClient.updateMeetingType(id, {
        name: updates.name,
        duration: updates.duration,
        description: updates.description,
        location: updates.location,
        active: updates.active,
        color: updates.color,
      });
      return this.transformMeetingType(data);
    } catch (error) {
      console.error('Error updating meeting type:', error);
      throw error;
    }
  }

  async deleteMeetingType(id: string): Promise<void> {
    try {
      await apiClient.deleteMeetingType(id);
    } catch (error) {
      console.error('Error deleting meeting type:', error);
      throw error;
    }
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    try {
      const data = await apiClient.getAppointments();
      return data.map((item: any) => this.transformAppointment(item));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  async createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    try {
      const data = await apiClient.createAppointment({
        meeting_type_id: appointment.meetingTypeId,
        meeting_type_name: appointment.meetingTypeName,
        client_name: appointment.clientName,
        client_email: appointment.clientEmail,
        client_phone: appointment.clientPhone,
        notes: appointment.notes,
        status: appointment.status,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
      });
      return this.transformAppointment(data);
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    try {
      const data = await apiClient.updateAppointment(id, {
        meeting_type_id: updates.meetingTypeId,
        meeting_type_name: updates.meetingTypeName,
        client_name: updates.clientName,
        client_email: updates.clientEmail,
        client_phone: updates.clientPhone,
        notes: updates.notes,
        status: updates.status,
        date: updates.date,
        time: updates.time,
        duration: updates.duration,
      });
      return this.transformAppointment(data);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(id: string): Promise<void> {
    try {
      await apiClient.deleteAppointment(id);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  // Availability
  async getAvailability(): Promise<Availability> {
    try {
      const data = await apiClient.getAvailability();

      // Transform database format to Availability interface
      const availability: Availability = {
        monday: { enabled: true, start: "09:00", end: "17:00" },
        tuesday: { enabled: true, start: "09:00", end: "17:00" },
        wednesday: { enabled: true, start: "09:00", end: "17:00" },
        thursday: { enabled: true, start: "09:00", end: "17:00" },
        friday: { enabled: true, start: "09:00", end: "17:00" },
        saturday: { enabled: false, start: "09:00", end: "17:00" },
        sunday: { enabled: false, start: "09:00", end: "17:00" },
      };

      data.forEach((item: any) => {
        if (item.day_of_week in availability) {
          availability[item.day_of_week as keyof Availability] = {
            enabled: item.enabled,
            start: item.start_time,
            end: item.end_time,
          };
        }
      });

      return availability;
    } catch (error) {
      console.error('Error fetching availability:', error);
      // Return default availability on error or unauthenticated
      return {
        monday: { enabled: true, start: "09:00", end: "17:00" },
        tuesday: { enabled: true, start: "09:00", end: "17:00" },
        wednesday: { enabled: true, start: "09:00", end: "17:00" },
        thursday: { enabled: true, start: "09:00", end: "17:00" },
        friday: { enabled: true, start: "09:00", end: "17:00" },
        saturday: { enabled: false, start: "09:00", end: "17:00" },
        sunday: { enabled: false, start: "09:00", end: "17:00" },
      };
    }
  }

  async updateAvailability(availability: Availability): Promise<void> {
    try {
      const availabilityData = Object.entries(availability).map(([day, settings]) => ({
        day_of_week: day,
        enabled: settings.enabled,
        start_time: settings.start,
        end_time: settings.end,
      }));

      await apiClient.updateAvailability(availabilityData);
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  // Settings
  async getSettings(): Promise<BookingSettings> {
    try {
      const data = await apiClient.getBookingSettings();
      return this.transformSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Return default settings on error
      return {
        minNoticeHours: 4,
        maxDaysInAdvance: 60,
        bufferMinutes: 0,
        n8nWebhookUrl: 'https://n8n.getostrichai.com/webhook/calendly',
      };
    }
  }

  async updateSettings(settings: Partial<BookingSettings>): Promise<BookingSettings> {
    try {
      const data = await apiClient.updateBookingSettings({
        min_notice_hours: settings.minNoticeHours,
        max_days_in_advance: settings.maxDaysInAdvance,
        buffer_minutes: settings.bufferMinutes,
        n8n_webhook_url: settings.n8nWebhookUrl,
      });
      return this.transformSettings(data);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // Transform functions
  private transformMeetingType(data: DatabaseMeetingType): MeetingType {
    return {
      id: data.id,
      name: data.name,
      duration: data.duration,
      description: data.description || '',
      location: data.location || '',
      active: data.active,
      color: data.color,
    };
  }

  private transformAppointment(data: DatabaseAppointment): Appointment {
    return {
      id: data.id,
      meetingTypeId: data.meeting_type_id,
      meetingTypeName: data.meeting_type_name,
      date: data.date,
      time: data.time,
      duration: data.duration,
      clientName: data.client_name,
      clientEmail: data.client_email,
      clientPhone: data.client_phone || undefined,
      notes: data.notes || undefined,
      status: data.status as "confirmed" | "cancelled" | "completed",
      createdAt: data.created_at,
    };
  }

  private transformSettings(data: DatabaseBookingSettings): BookingSettings {
    return {
      minNoticeHours: data.min_notice_hours,
      maxDaysInAdvance: data.max_days_in_advance,
      bufferMinutes: data.buffer_minutes,
      n8nWebhookUrl: data.n8n_webhook_url || undefined,
    };
  }
}

export const bookingService = new BookingService();
