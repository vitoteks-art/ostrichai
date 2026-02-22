import { BookingLayout } from "@/components/BookingLayout";
import { useBooking } from "@/contexts/BookingContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, X, CheckCircle, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";

export default function BookingAppointments() {
  const { appointments, cancelAppointment } = useBooking();
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled" | "completed">("all");

  const filteredAppointments = appointments
    .filter((apt) => filter === "all" || apt.status === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <BookingLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
            <p className="text-muted-foreground mt-2">View and manage all appointments</p>
          </div>
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({appointments.length})
          </Button>
          <Button
            variant={filter === "confirmed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("confirmed")}
          >
            Confirmed ({appointments.filter((a) => a.status === "confirmed").length})
          </Button>
          <Button
            variant={filter === "cancelled" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("cancelled")}
          >
            Cancelled ({appointments.filter((a) => a.status === "cancelled").length})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed ({appointments.filter((a) => a.status === "completed").length})
          </Button>
        </div>

        {/* Appointments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments List</CardTitle>
            <CardDescription>
              {filteredAppointments.length} {filter === "all" ? "" : filter} appointment(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appointments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Meeting Type</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{apt.clientName}</p>
                            <p className="text-sm text-muted-foreground">{apt.clientEmail}</p>
                            {apt.clientPhone && (
                              <p className="text-sm text-muted-foreground">{apt.clientPhone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{apt.meetingTypeName}</TableCell>
                        <TableCell>
                          <div>
                            <p>{format(parseISO(apt.date), "MMM dd, yyyy")}</p>
                            <p className="text-sm text-muted-foreground">{apt.time}</p>
                          </div>
                        </TableCell>
                        <TableCell>{apt.duration} min</TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell>
                          {apt.status === "confirmed" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this appointment with{" "}
                                    {apt.clientName}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No, keep it</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => cancelAppointment(apt.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Yes, cancel
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BookingLayout>
  );
}
