import { z } from "zod";

export const createAddressSchema = z.object({
  label: z.string().min(1, "Label is required").default("Home"),
  recipientName: z
    .string()
    .min(2, "Recipient name be at least 2 characters long"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required").default("Indonesia"),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
