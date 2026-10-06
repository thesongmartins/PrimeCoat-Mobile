import { z } from "zod";

/** Mirrors signUpSchema in lib/validations/auth.ts (web). Supabase enforces its own rules again. */
export const PASSWORD_MIN = 8;

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(254));

const newPassword = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  .max(72, "Use 72 characters or fewer")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Include at least one letter and one number");

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export type SignUpInput = z.infer<typeof signUpSchema>;
