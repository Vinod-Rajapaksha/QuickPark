import { z } from "zod";

export const MAX_NIC_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_NIC_CONTENT_TYPES = ["image/jpeg", "image/png"];

export const nicFileSchema = z
  .instanceof(File, { message: "Please choose a file to upload." })
  .refine((file) => file.size > 0, "The selected file is empty.")
  .refine(
    (file) => file.size <= MAX_NIC_FILE_BYTES,
    "NIC image must be 5 MB or smaller.",
  )
  .refine(
    (file) => ALLOWED_NIC_CONTENT_TYPES.includes(file.type),
    "Only JPG or PNG images are accepted.",
  )
  .refine(
    (file) => /\.(jpe?g|png)$/i.test(file.name),
    "File name must end with .jpg, .jpeg or .png.",
  );

export type NicFile = z.infer<typeof nicFileSchema>;
