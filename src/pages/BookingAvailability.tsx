import { BookingLayout } from "@/components/BookingLayout";
import { useBooking } from "@/contexts/BookingContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Availability, DayAvailability } from "@/types/booking";

export default function BookingAvailability() {
  const { availability, updateAvailability } = useBooking();
  const [localAvailability, setLocalAvailability] = useState<Availability>(availability);
  const { toast } = useToast();

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ] as const;

  const handleDayToggle = (day: keyof Availability) => {
    setLocalAvailability({
      ...localAvailability,
      [day]: {
        ...localAvailability[day],
        enabled: !localAvailability[day].enabled,
      },
    });
  };

  const handleTimeChange = (
    day: keyof Availability,
    field: "start" | "end",
    value: string
  ) => {
    setLocalAvailability({
      ...localAvailability,
      [day]: {
        ...localAvailability[day],
        [field]: value,
      },
    });
  };

  const handleSave = () => {
    updateAvailability(localAvailability);
    toast({
      title: "Availability Updated",
      description: "Your availability settings have been saved successfully.",
    });
  };

  const handleReset = () => {
    setLocalAvailability(availability);
    toast({
      title: "Changes Discarded",
      description: "Your availability settings have been reset.",
    });
  };

  return (
    <BookingLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Availability</h1>
            <p className="text-muted-foreground mt-2">
              Set your weekly availability for appointments
            </p>
          </div>
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              Configure when you're available for bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {days.map(({ key, label }) => {
              const dayData = localAvailability[key];
              return (
                <div key={key} className="flex items-center space-x-4 pb-4 border-b last:border-0">
                  <div className="flex items-center space-x-2 w-32">
                    <Switch
                      checked={dayData.enabled}
                      onCheckedChange={() => handleDayToggle(key)}
                      id={`${key}-enabled`}
                    />
                    <Label
                      htmlFor={`${key}-enabled`}
                      className="font-medium cursor-pointer"
                    >
                      {label}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`${key}-start`} className="text-sm text-muted-foreground">
                        From
                      </Label>
                      <Input
                        id={`${key}-start`}
                        type="time"
                        value={dayData.start}
                        onChange={(e) => handleTimeChange(key, "start", e.target.value)}
                        disabled={!dayData.enabled}
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`${key}-end`} className="text-sm text-muted-foreground">
                        To
                      </Label>
                      <Input
                        id={`${key}-end`}
                        type="time"
                        value={dayData.end}
                        onChange={(e) => handleTimeChange(key, "end", e.target.value)}
                        disabled={!dayData.enabled}
                        className="w-32"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {dayData.enabled
                      ? `${dayData.start} - ${dayData.end}`
                      : "Unavailable"}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleReset}>
            Reset Changes
          </Button>
          <Button onClick={handleSave}>Save Availability</Button>
        </div>
      </div>
    </BookingLayout>
  );
}
