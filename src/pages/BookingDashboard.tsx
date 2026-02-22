import { BookingLayout } from "@/components/BookingLayout";
import { useBooking } from "@/contexts/BookingContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export default function BookingDashboard() {
  const { appointments, meetingTypes } = useBooking();

  const upcomingAppointments = appointments
    .filter((apt) => apt.status === "confirmed" && new Date(apt.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const todayAppointments = appointments.filter(
    (apt) => apt.status === "confirmed" && isToday(parseISO(apt.date))
  );

  const activeMeetingTypes = meetingTypes.filter((mt) => mt.active);

  const stats = [
    {
      title: "Total Appointments",
      value: appointments.length,
      icon: Calendar,
      description: "All time",
    },
    {
      title: "Today's Appointments",
      value: todayAppointments.length,
      icon: Clock,
      description: "Scheduled for today",
    },
    {
      title: "Active Meeting Types",
      value: activeMeetingTypes.length,
      icon: Users,
      description: "Available for booking",
    },
    {
      title: "Confirmed",
      value: appointments.filter((apt) => apt.status === "confirmed").length,
      icon: CheckCircle,
      description: "Confirmed bookings",
    },
  ];

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM dd, yyyy");
  };

  return (
    <BookingLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Booking Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your appointments and availability
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your next scheduled meetings</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming appointments</p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{apt.clientName}</p>
                      <p className="text-sm text-muted-foreground">{apt.meetingTypeName}</p>
                      <p className="text-xs text-muted-foreground">{apt.clientEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{getDateLabel(apt.date)}</p>
                      <p className="text-sm text-muted-foreground">{apt.time}</p>
                      <p className="text-xs text-muted-foreground">{apt.duration} min</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Meeting Types */}
        <Card>
          <CardHeader>
            <CardTitle>Active Meeting Types</CardTitle>
            <CardDescription>Currently available for booking</CardDescription>
          </CardHeader>
          <CardContent>
            {activeMeetingTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active meeting types</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeMeetingTypes.map((mt) => (
                  <div
                    key={mt.id}
                    className="flex items-start space-x-3 rounded-lg border p-4"
                    style={{ borderLeftColor: mt.color, borderLeftWidth: "4px" }}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{mt.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{mt.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>{mt.duration} minutes</span>
                        <span>{mt.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BookingLayout>
  );
}
