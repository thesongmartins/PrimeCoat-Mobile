import { z } from "zod";
import { NIGERIA_STATES } from "@/constants/nigeria-states";

/** Mirrors checkoutSchema in lib/validations/checkout.ts (web). The server validates again. */
const NIGERIAN_PHONE = /^(?:\+234|0)[7-9][01]\d{8}$/;

export function normalisePhone(value: string): string {
  return value.replace(/[\s()-]/g, "");
}

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100, "Name is too long"),
  email: z.email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .min(1, "Enter your phone number")
    .refine((v) => NIGERIAN_PHONE.test(normalisePhone(v)), "Enter a valid Nigerian phone number, e.g. 0803 123 4567"),
  deliveryAddress: z.string().trim().min(5, "Enter your street address").max(300, "Address is too long"),
  city: z.string().trim().min(2, "Enter your city or town").max(100),
  state: z.enum(NIGERIA_STATES, { message: "Select your state" }),
  deliveryInstructions: z.string().trim().max(500, "Keep instructions under 500 characters").optional().or(z.literal("")),
  paymentMethod: z.enum(["pay_on_delivery", "card"]).default("pay_on_delivery"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
