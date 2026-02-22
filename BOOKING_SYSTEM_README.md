# Calendly-like Appointment Booking System Integration

## Overview

A complete appointment booking system has been successfully integrated into your application. This system allows you to manage appointments, set availability, create meeting types, and let clients book appointments through a public booking page.

## Features

✅ **Admin Dashboard** - Overview of appointments and meeting types
✅ **Appointment Management** - View, filter, and cancel appointments
✅ **Availability Settings** - Configure weekly availability schedule
✅ **Meeting Types** - Create and manage different types of meetings
✅ **Settings** - Configure booking rules and webhook integration
✅ **Public Booking Page** - Client-facing page for booking appointments
✅ **Supabase Database** - Multi-user data storage with real-time sync
✅ **Automatic Webhook Integration** - Webhooks trigger instantly on booking submission
✅ **Webhook Testing** - Test webhook URLs before going live
✅ **Enhanced Error Handling** - Better logging and CORS support
✅ **Response Display** - Shows webhook response data to users
✅ **Loading States** - Visual feedback during operations

## File Structure

```
src/
├── types/
│   └── booking.ts                      # TypeScript type definitions
├── contexts/
│   └── BookingContext.tsx              # State management context (database-aware)
├── services/
│   └── bookingService.ts               # Database operations service
├── components/
│   └── BookingLayout.tsx               # Admin layout component
└── pages/
    ├── BookingDashboard.tsx            # Admin dashboard
    ├── BookingAppointments.tsx         # Appointments list
    ├── BookingAvailability.tsx         # Availability settings
    ├── BookingMeetingTypes.tsx         # Meeting types management
    ├── BookingSettings.tsx             # System settings
    └── PublicBooking.tsx               # Public booking page

Database/
└── booking-schema.sql                  # Supabase database schema
```

## Routes

### Admin Routes (Protected - Requires Admin Role)
- `/booking` - Booking Dashboard
- `/booking/appointments` - View and manage appointments
- `/booking/availability` - Set your weekly availability
- `/booking/meeting-types` - Create and manage meeting types
- `/booking/settings` - Configure booking settings

### Public Routes (Accessible to Everyone)
- `/book` - Public booking page for clients

## How to Use

### 1. Access the Booking System

After logging in, navigate to the **Booking** dropdown in the navigation bar (Calendar icon). You'll find:
- **Book Appointment** - Public booking page (accessible to all)
- **Dashboard** - Admin overview
- **Appointments** - Manage appointments
- **Availability** - Set availability
- **Meeting Types** - Manage meeting types
- **Settings** - Configure settings

### 2. Set Your Availability

1. Go to `/booking/availability`
2. Toggle days on/off to set when you're available
3. Set start and end times for each day
4. Click "Save Availability"

### 3. Create Meeting Types

1. Go to `/booking/meeting-types`
2. Click "Add Meeting Type"
3. Fill in:
   - Meeting Name (e.g., "30-min Consultation")
   - Duration in minutes
   - Description
   - Location (e.g., "Google Meet", "Zoom")
   - Color for visual identification
   - Active status
4. Click "Create Meeting Type"

### 4. Configure Settings

Go to `/booking/settings` to configure:
- **Minimum Notice Hours**: How far in advance clients must book
- **Maximum Days in Advance**: How far ahead clients can book
- **Buffer Time**: Time between appointments
- **n8n Webhook URL**: Pre-configured to your n8n instance (test and modify if needed)

### 5. Share Your Booking Link

The public booking link is: `your-domain.com/book`

Copy this link from the Settings page and share it with clients.

## Public Booking Flow

When clients visit `/book`, they will:

1. **Select a Meeting Type** - Choose from your active meeting types
2. **Pick a Date and Time** - View your availability and select a slot
3. **Fill in Details** - Provide name, email, phone (optional), and notes
4. **Confirm Booking** - System processes booking and waits for webhook response
5. **View Unified Summary** - See booking confirmation, meeting links, and details in one section

## Webhook Integration (n8n)

The system **automatically triggers webhooks** when bookings are submitted:

### ✅ Automatic Webhook Triggering
- **When a user submits a booking** → Webhook is triggered immediately
- **Loading indicators** show webhook processing status
- **Visual confirmation** shows webhook was sent successfully
- **Response display** shows booking details from webhook response
- **Meeting links** and confirmation IDs displayed to users
- **Unified design** matches your app's color scheme and styling

### Events
- `appointment.created` - When a new appointment is booked
- `appointment.updated` - When an appointment is modified
- `appointment.cancelled` - When an appointment is cancelled

### Payload Example
```json
{
  "event": "appointment.created",
  "data": {
    "id": "123",
    "clientName": "John Doe",
    "clientEmail": "john@example.com",
    "clientPhone": "+1234567890",
    "meetingTypeName": "30-min Consultation",
    "date": "2024-01-15",
    "time": "10:00",
    "duration": 30,
    "status": "confirmed",
    "notes": "Looking forward to discussing the project"
  },
  "timestamp": "2024-01-10T12:00:00.000Z"
}
```

### Webhook URL
**Hardcoded URL**: `https://n8n.srv939063.hstgr.cloud/webhook/calendly`

**Note**: The webhook URL is hardcoded in the system. If this URL doesn't work, you can modify it in `/booking/settings` or test it first using the "Test" button.

### Response Format
Your webhook should return data in this format for optimal user experience:

```json
[
  {
    "output": {
      "success": true,
      "message": "Appointment booked successfully",
      "appointmentSummary": {
        "service": "30-min Consultation",
        "date": "2025-10-27",
        "time": "15:00",
        "duration": "30 minutes",
        "confirmationId": "1761307401881",
        "clientName": "Victor Olayemi",
        "clientEmail": "victorolayemi10@gmail.com",
        "status": "confirmed"
      },
      "meetingLink": "https://meet.google.com/ccx-tpms-sda",
      "emailsSent": {
        "client": true,
        "owner": true
      }
    }
  }
]
```

**Response Display**: Users will see confirmation IDs, meeting links, and email status directly on the booking confirmation page.

### Setup Instructions
1. **Run database schema** in your Supabase SQL editor (see `booking-schema.sql`)
2. **Verify tables created** - Check that all booking tables exist in Supabase
3. **Webhook URL is pre-configured** to: `https://n8n.srv939063.hstgr.cloud/webhook/calendly`
4. **Test the connection** using the "Test" button in Settings
5. **Modify the URL** if needed in `/booking/settings` (optional)
6. **Every booking submission** will trigger the webhook automatically

### Quick Test
1. Go to `/book` (public booking page)
2. Fill out and submit a test booking
3. **View response**: See booking details, meeting links, and confirmation from your system
4. Check browser console for webhook logs
5. Or run `window.testBookingFlow()` in console for manual test with response display

### Migration from localStorage
If you have existing localStorage data, it will be automatically migrated to the database when you first load the booking system with an authenticated user. The migration preserves all your:
- Meeting types and configurations
- Availability settings
- Existing appointments
- System settings and webhook URLs

### Troubleshooting Schema Setup
If you encounter the error "42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification":

1. **Check table creation** - Ensure all tables were created successfully
2. **Verify constraints** - Confirm UNIQUE constraints are properly added
3. **Run schema in order** - Execute the SQL in the order presented
4. **Check Supabase version** - Ensure compatibility with PostgreSQL features

### Webhook Features
- ✅ **Fixed CORS issues** - Removed `mode: "no-cors"` for proper request sending
- ✅ **Enhanced error handling** - Better logging and error reporting
- ✅ **Test functionality** - Verify webhook URL before going live
- ✅ **Visual feedback** - Users see webhook processing status
- ✅ **Automatic triggering** - No manual intervention required
- ✅ **URL validation** - Visual indicators for invalid URLs
- ✅ **Console debugging** - Detailed logs in browser console
- ✅ **Manual testing** - Test functions available in browser console
- ✅ **Fallback mechanism** - Tries no-cors mode if CORS fails
- ✅ **Response handling** - Displays webhook response data to users
- ✅ **Meeting links** - Shows Google Meet/Zoom links from webhook
- ✅ **Confirmation IDs** - Displays booking confirmation numbers
- ✅ **Email status** - Shows if confirmation emails were sent
- ✅ **Unified design** - Matches your app's color scheme and styling
- ✅ **Single summary** - One consolidated booking details section

## Data Storage

All booking data is stored in **Supabase database** with localStorage fallback:

### Database Tables
- `meeting_types` - Your meeting type configurations
- `appointments` - All booked appointments with full details
- `availability_settings` - Your weekly availability schedule
- `booking_settings` - System settings and webhook configuration

### Features
- ✅ **Multi-user support** - All users share the same appointment data
- ✅ **Real-time sync** - Changes reflect immediately across sessions
- ✅ **Data persistence** - Survives browser crashes and device changes
- ✅ **Admin access** - View and manage all appointments from one dashboard
- ✅ **Backup & recovery** - Server-side backups protect against data loss

## Customization

### Colors
Each meeting type can have a custom color. Use the color picker when creating or editing meeting types.

### Meeting Duration
Meeting durations are in minutes and can be set to any value (e.g., 15, 30, 45, 60).

### Buffer Time
Add buffer time between appointments in the Settings to give yourself breaks or preparation time.

## Best Practices

1. **Set Realistic Availability**: Only mark times when you're consistently available
2. **Clear Descriptions**: Write clear meeting type descriptions so clients know what to expect
3. **Use Buffer Time**: Add 5-15 minutes buffer between appointments
4. **Regular Updates**: Keep your availability and meeting types current
5. **Test Your Link**: Visit `/book` yourself to ensure everything works correctly

## Troubleshooting

### Appointments Not Showing
- Check that meeting types are set to "Active"
- Verify your availability is enabled for the selected day
- Ensure the date is within your max days in advance setting

### Public Booking Page Not Working
- Clear browser localStorage and refresh
- Check that at least one meeting type is active
- Verify your availability settings

### Webhook Not Triggering
- **Test the webhook** using the "Test" button in Settings (✅ validates URL format)
- **Check console logs** for detailed error messages (✅ enhanced logging)
- **Verify webhook URL** is correct and accessible
- **Check CORS settings** in your n8n workflow if needed
- **Review browser console** for detailed webhook responses
- **Manual testing**: Run `window.testBookingWebhook()` in browser console
- **Full flow testing**: Run `window.testBookingFlow()` in browser console
- **URL validation**: Red border shows if URL format is invalid

## Future Enhancements

Potential features for future development:
- Email notifications (requires backend integration)
- Calendar sync (Google Calendar, Outlook)
- Time zone support
- Recurring appointments
- Payment integration
- Video call link generation
- SMS reminders
- Multi-user support

## Support

For questions or issues with the booking system, please refer to this documentation or contact the development team.

---

**Version**: 2.0.0
**Last Updated**: October 2024
**Storage**: ✅ Supabase Database (Multi-User)
**Webhook Integration**: ✅ Active, Enhanced, Response-Aware, and Design-Unified