import { z } from "zod";

// The datetime-local controls submit wall-clock strings, and the server interprets them in its own zone.
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const facilityId = z.string().min(1, "Select a property");
const vehicleTypeId = z.string().min(1, "Select a vehicle type");
// Empty means "assign the lowest free bay", so it is never a validation failure.
const slotId = z.string();
const startTime = z.string().regex(DATETIME_PATTERN, "Pick a start date and time");
const endTime = z.string().regex(DATETIME_PATTERN, "Pick an end date and time");

export const providerBookingSchema = z
  .object({
    facilityId,
    vehicleTypeId,
    slotId,
    driverEmail: z.string().trim().regex(EMAIL_PATTERN, "Enter the driver's registered email"),
    startTime,
    endTime,
  })
  .superRefine((value, ctx) => {
    const start = Date.parse(value.startTime);
    const end = Date.parse(value.endTime);
    if (Number.isNaN(start) || Number.isNaN(end)) return;
    if (end <= start)
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "The booking must end after it starts",
      });
  });

// Moving a booking keeps its driver unless the owner types another address.
export const providerBookingEditSchema = z
  .object({
    facilityId,
    vehicleTypeId,
    slotId,
    driverEmail: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || EMAIL_PATTERN.test(value),
        "Enter a valid address, or leave it empty to keep the driver",
      ),
    startTime,
    endTime,
  })
  .superRefine((value, ctx) => {
    const start = Date.parse(value.startTime);
    const end = Date.parse(value.endTime);
    if (Number.isNaN(start) || Number.isNaN(end)) return;
    if (end <= start)
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "The booking must end after it starts",
      });
  });

export type ProviderBookingValues = z.infer<typeof providerBookingSchema>;
