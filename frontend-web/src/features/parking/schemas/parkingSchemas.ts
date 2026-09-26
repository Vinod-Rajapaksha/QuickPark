import { z } from "zod";
import { isDistrictOfProvince } from "../../../app/config/constants";
import {
  ALLOWED_NIC_CONTENT_TYPES as ALLOWED_DOCUMENT_CONTENT_TYPES,
  MAX_NIC_FILE_BYTES as MAX_DOCUMENT_FILE_BYTES,
} from "../../providers/schemas/providerSchemas";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const provinceField = z.string().min(1, "Province is required");
const districtField = z.string().min(1, "District is required");

// Province/District pairing is enforced here and again on the server.
export const parkingLocationSchema = z
  .object({ province: provinceField, district: districtField })
  .superRefine((value, ctx) => {
    if (!isDistrictOfProvince(value.province, value.district)) {
      ctx.addIssue({
        code: "custom",
        path: ["district"],
        message: "District must belong to the selected province",
      });
    }
  });

export const parkingFormSchema = z
  .object({
    name: z.string().min(2, "Property name is too short").max(150, "Too long"),
    address: z.string().min(5, "Address is too short").max(300, "Too long"),
    city: z.string().min(2, "City is too short").max(100, "Too long"),
    province: provinceField,
    district: districtField,
    landAreaPerches: z
      .number({ message: "Land area is required" })
      .positive("Land area must be greater than 0 perches")
      .max(100000, "Land area looks too large"),
    openingTime: z.string().regex(TIME_PATTERN, "Use 24-hour HH:MM"),
    closingTime: z.string().regex(TIME_PATTERN, "Use 24-hour HH:MM"),
    hasEvCharging: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!isDistrictOfProvince(value.province, value.district)) {
      ctx.addIssue({
        code: "custom",
        path: ["district"],
        message: "District must belong to the selected province",
      });
    }

    // Both halves are compared only once each is a usable time, so a format error is not doubled.
    if (
      TIME_PATTERN.test(value.openingTime) &&
      TIME_PATTERN.test(value.closingTime) &&
      value.closingTime <= value.openingTime
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["closingTime"],
        message: "Closing time must be later than opening time",
      });
    }
  });

export type ParkingFormValues = z.infer<typeof parkingFormSchema>;

// Same limits the backend enforces (DocumentFileValidator), property-document wording.
export const facilityDocumentFileSchema = z
  .instanceof(File, { message: "Please choose a file to upload." })
  .refine((file) => file.size > 0, "The selected file is empty.")
  .refine(
    (file) => file.size <= MAX_DOCUMENT_FILE_BYTES,
    `Document image must be ${MAX_DOCUMENT_FILE_BYTES / (1024 * 1024)} MB or smaller.`,
  )
  .refine(
    (file) => ALLOWED_DOCUMENT_CONTENT_TYPES.includes(file.type),
    "Only JPG or PNG images are accepted.",
  )
  .refine(
    (file) => /\.(jpe?g|png)$/i.test(file.name),
    "File name must end with .jpg, .jpeg or .png.",
  );
