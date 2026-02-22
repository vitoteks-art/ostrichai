import React, { createContext, useContext, useState, useEffect } from "react";
import { MeetingType, Availability, Appointment, BookingSettings } from "@/types/booking";
import { bookingService } from "@/services/bookingService";
import { useAuth } from "./AuthContext";

interface BookingContextType {
  meetingTypes: MeetingType[];
  availability: Availability;
  appointments: Appointment[];
  settings: BookingSettings;
  loading: boolean;
  addMeetingType: (meetingType: MeetingType) => Promise<void>;
  updateMeetingType: (id: string, meetingType: Partial<MeetingType>) => Promise<void>;
  deleteMeetingType: (id: string) => Promise<void>;
  updateAvailability: (availability: Availability) => Promise<void>;
  addAppointment: (appointment: Appointment) => Promise<any>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<BookingSettings>) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const defaultAvailability: Availability = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "17:00" },
  saturday: { enabled: false, start: "09:00", end: "17:00" },
  sunday: { enabled: false, start: "09:00", end: "17:00" },
};

const defaultMeetingTypes: MeetingType[] = [
  {
    id: "1",
    name: "15-min Quick Call",
    duration: 15,
    description: "A brief chat to discuss your needs",
    location: "Google Meet (link will be provided)",
    active: true,
    color: "#0069FF",
  },
  {
    id: "2",
    name: "30-min Consultation",
    duration: 30,
    description: "In-depth discussion about your project",
    location: "Zoom (link will be provided)",
    active: true,
    color: "#00C4CC",
  },
];

const defaultSettings: BookingSettings = {
  minNoticeHours: 4,
  maxDaysInAdvance: 60,
  bufferMinutes: 0,
  n8nWebhookUrl: "https://n8n.getostrichai.com/webhook/calendly",
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>(defaultMeetingTypes);
  const [availability, setAvailability] = useState<Availability>(defaultAvailability);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<BookingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load data from database when component mounts or user changes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Always try to load from database first (for both authenticated and unauthenticated users)
        const [meetingTypesData, availabilityData, appointmentsData, settingsData] = await Promise.allSettled([
          bookingService.getMeetingTypes(), // Public meeting types are accessible to all
          user ? bookingService.getAvailability(user.id) : Promise.resolve(defaultAvailability),
          user ? bookingService.getAppointments(user.id) : Promise.resolve([]),
          user ? bookingService.getSettings(user.id) : Promise.resolve(defaultSettings),
        ]);

        if (meetingTypesData.status === 'fulfilled') {
          setMeetingTypes(meetingTypesData.value);
        }

        if (availabilityData.status === 'fulfilled') {
          setAvailability(availabilityData.value);
        }

        if (appointmentsData.status === 'fulfilled') {
          setAppointments(appointmentsData.value);
        }

        if (settingsData.status === 'fulfilled') {
          setSettings(settingsData.value);
        }
      } catch (error) {
        console.error('Error loading booking data:', error);
        // Only fallback to localStorage if database is completely unavailable
        // This should be rare - database should work for both authenticated and unauthenticated users
        console.log('Database unavailable, checking localStorage as last resort...');
        const savedMeetingTypes = localStorage.getItem("meetingTypes");
        const savedAvailability = localStorage.getItem("availability");
        const savedAppointments = localStorage.getItem("appointments");
        const savedSettings = localStorage.getItem("settings");

        if (savedMeetingTypes) setMeetingTypes(JSON.parse(savedMeetingTypes));
        if (savedAvailability) setAvailability(JSON.parse(savedAvailability));
        if (savedAppointments) setAppointments(JSON.parse(savedAppointments));
        if (savedSettings) setSettings(JSON.parse(savedSettings));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const addMeetingType = async (meetingType: MeetingType) => {
    try {
      const newMeetingType = await bookingService.createMeetingType(meetingType);
      setMeetingTypes([...meetingTypes, newMeetingType]);
    } catch (error) {
      console.error('Error adding meeting type:', error);
      // Only fallback to local state for unauthenticated users
      if (!user) {
        setMeetingTypes([...meetingTypes, meetingType]);
      } else {
        throw error; // Re-throw for authenticated users
      }
    }
  };

  const updateMeetingType = async (id: string, updates: Partial<MeetingType>) => {
    try {
      const updatedMeetingType = await bookingService.updateMeetingType(id, updates);
      setMeetingTypes(
        meetingTypes.map((mt) => (mt.id === id ? updatedMeetingType : mt))
      );
    } catch (error) {
      console.error('Error updating meeting type:', error);
      // Only fallback to local state for unauthenticated users
      if (!user) {
        setMeetingTypes(
          meetingTypes.map((mt) => (mt.id === id ? { ...mt, ...updates } : mt))
        );
      } else {
        throw error; // Re-throw for authenticated users
      }
    }
  };

  const deleteMeetingType = async (id: string) => {
    try {
      await bookingService.deleteMeetingType(id);
      setMeetingTypes(meetingTypes.filter((mt) => mt.id !== id));
    } catch (error) {
      console.error('Error deleting meeting type:', error);
      // Only fallback to local state for unauthenticated users
      if (!user) {
        setMeetingTypes(meetingTypes.filter((mt) => mt.id !== id));
      } else {
        throw error; // Re-throw for authenticated users
      }
    }
  };

  const updateAvailability = async (newAvailability: Availability) => {
    try {
      if (user) {
        await bookingService.updateAvailability(newAvailability, user.id);
      } else {
        // For unauthenticated users, just update local state
        setAvailability(newAvailability);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      // Fallback to local state update
      setAvailability(newAvailability);
    }
  };

  const addAppointment = async (appointment: Appointment): Promise<any> => {
    try {
      const newAppointment = await bookingService.createAppointment(appointment);
      setAppointments([...appointments, newAppointment]);
      const webhookResponse = await triggerWebhook("appointment.created", newAppointment);
      return webhookResponse;
    } catch (error) {
      console.error('Error creating appointment:', error);
      // Fallback to local state
      setAppointments([...appointments, appointment]);
      const webhookResponse = await triggerWebhook("appointment.created", appointment);
      return webhookResponse;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const updatedAppointment = await bookingService.updateAppointment(id, updates);
      setAppointments(
        appointments.map((apt) => (apt.id === id ? updatedAppointment : apt))
      );
      await triggerWebhook("appointment.updated", updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      // Fallback to local state
      const updatedAppointments = appointments.map((apt) =>
        apt.id === id ? { ...apt, ...updates } : apt
      );
      setAppointments(updatedAppointments);
      const updatedAppointment = updatedAppointments.find((apt) => apt.id === id);
      if (updatedAppointment) {
        triggerWebhook("appointment.updated", updatedAppointment);
      }
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      const appointment = appointments.find((apt) => apt.id === id);
      if (appointment) {
        await updateAppointment(id, { status: "cancelled" });
        await triggerWebhook("appointment.cancelled", { ...appointment, status: "cancelled" });
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      // Fallback to local state
      const appointment = appointments.find((apt) => apt.id === id);
      updateAppointment(id, { status: "cancelled" });
      if (appointment) {
        triggerWebhook("appointment.cancelled", { ...appointment, status: "cancelled" });
      }
    }
  };

  const updateSettings = async (newSettings: Partial<BookingSettings>) => {
    try {
      if (user) {
        const updatedSettings = await bookingService.updateSettings(newSettings, user.id);
        setSettings(updatedSettings);
      } else {
        // For unauthenticated users, just update local state
        setSettings({ ...settings, ...newSettings });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      // Fallback to local state
      setSettings({ ...settings, ...newSettings });
    }
  };

  const triggerWebhook = async (event: string, data: any): Promise<any> => {
    // Use database settings or fallback to hardcoded URL
    const webhookUrl = settings.n8nWebhookUrl || "https://n8n.getostrichai.com/webhook/calendly";

    console.log(`🚀 Triggering webhook: ${event}`);
    console.log("📡 Webhook URL:", webhookUrl);
    console.log("📦 Payload:", JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    }, null, 2));

    try {
      // Try with CORS first
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log(`📡 Webhook response status: ${response.status}`);

      if (response.ok) {
        console.log(`✅ n8n webhook triggered successfully: ${event}`);
        const responseText = await response.text();
        console.log("📨 Response:", responseText);

        try {
          const responseData = JSON.parse(responseText);
          console.log("📋 Parsed response:", responseData);
          return responseData;
        } catch (parseError) {
          console.log("📄 Raw response (not JSON):", responseText);
          return responseText;
        }
      } else {
        console.error(`❌ Webhook failed with status: ${response.status}`);
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Error triggering n8n webhook:", error);
      console.error("❌ Webhook URL:", webhookUrl);
      console.error("❌ Error details:", error);

      // If CORS fails, try with no-cors mode as fallback
      console.log("🔄 Retrying with no-cors mode...");
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString(),
          }),
        });
        console.log(`✅ n8n webhook sent (no-cors mode): ${event}`);
        return { success: true, message: "Booking submitted (no response available)" };
      } catch (fallbackError) {
        console.error("❌ Fallback webhook also failed:", fallbackError);
        throw fallbackError;
      }
    }
  };

  return (
    <BookingContext.Provider
      value={{
        meetingTypes,
        availability,
        appointments,
        settings,
        loading,
        addMeetingType,
        updateMeetingType,
        deleteMeetingType,
        updateAvailability,
        addAppointment,
        updateAppointment,
        cancelAppointment,
        updateSettings,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

// Make webhook functions available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testBookingWebhook = async (event: string = "test", data: any = { message: "Test webhook" }) => {
    console.log("🧪 Manual webhook test triggered");

    try {
      // Get current settings from context or localStorage
      const settings = JSON.parse(localStorage.getItem("settings") || "{}");
      const webhookUrl = settings.n8nWebhookUrl || "https://n8n.getostrichai.com/webhook/calendly";
      console.log("📡 Using webhook URL:", webhookUrl);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log(`✅ Manual webhook test successful: ${response.status}`);

      if (response.ok) {
        const responseText = await response.text();
        try {
          const responseData = JSON.parse(responseText);
          console.log("📋 Parsed response:", responseData);
          return responseData;
        } catch (parseError) {
          console.log("📄 Raw response:", responseText);
          return responseText;
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Manual webhook test failed:", error);
      throw error;
    }
  };

  // Test full booking flow
  (window as any).testBookingFlow = async () => {
    console.log("🧪 Testing full booking flow...");

    // Create a test appointment
    const testAppointment = {
      id: "test-" + Date.now(),
      meetingTypeId: "1",
      meetingTypeName: "Test Meeting",
      date: new Date().toISOString().split('T')[0],
      time: "10:00",
      duration: 30,
      clientName: "Test User",
      clientEmail: "test@example.com",
      clientPhone: "+1234567890",
      notes: "This is a test booking",
      status: "confirmed" as const,
      createdAt: new Date().toISOString(),
    };

    console.log("📝 Test appointment:", testAppointment);

    try {
      // Get current settings from context or localStorage
      const settings = JSON.parse(localStorage.getItem("settings") || "{}");
      const webhookUrl = settings.n8nWebhookUrl || "https://n8n.getostrichai.com/webhook/calendly";
      console.log("📡 Using webhook URL:", webhookUrl);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "appointment.created",
          data: testAppointment,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log(`✅ Test booking webhook successful: ${response.status}`);

      if (response.ok) {
        const responseText = await response.text();
        try {
          const responseData = JSON.parse(responseText);
          console.log("📋 Full response:", responseData);
          return responseData;
        } catch (parseError) {
          console.log("📄 Raw response:", responseText);
          return responseText;
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Test booking webhook failed:", error);
      throw error;
    }
  };
}

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return context;
};
