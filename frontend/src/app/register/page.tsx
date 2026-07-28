"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";
import { api, ApiError } from "@/lib/api-client";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton } from "@/components/auth/AuthButton";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { PhoneNumberField } from "@/components/PhoneNumberField";
import { icons } from "@/lib/icons";

const schema = z
  .object({
    fullName: z
      .string()
      .min(2, "Enter your full name.")
      .max(50, "Full name must be 50 characters or fewer.")
      .regex(/^[A-Za-z\s-]+$/, "Only letters, spaces and hyphens are allowed."),
    email: z.string().email("Enter a valid email address."),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required.")
      .refine((v) => isValidPhoneNumber(v), "Enter a valid phone number for the selected country."),
    dateOfBirth: z.string().min(1, "Date of birth is required.").refine((v) => new Date(v) < new Date(), "Date of birth must be in the past."),
    password: z
      .string()
      .min(10, "At least 10 characters.")
      .regex(/[A-Z]/, "Include an uppercase letter.")
      .regex(/[a-z]/, "Include a lowercase letter.")
      .regex(/[0-9]/, "Include a digit.")
      .regex(/[^a-zA-Z0-9]/, "Include a special character."),
    confirmPassword: z.string().min(1, "Re-enter your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { phoneNumber: "" } });

  const password = watch("password", "");

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await api.post("/api/v1/auth/register", {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        dateOfBirth: values.dateOfBirth,
        password: values.password,
      });
      router.push("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldMessages = Object.values(err.fieldErrors).flat();
        setServerError(fieldMessages.length > 0 ? fieldMessages.join(" ") : err.message);
      } else {
        setServerError("Unable to register.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="New patient"
      title="No more phone tag."
      subtitle="Create an account to book a real open slot with a doctor — see availability, pick a time, done."
    >
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight">Create your account</h2>
      <p className="mt-1 text-sm text-[var(--mist)]">
        Fields marked <span className="text-[var(--coral)]">*</span> are required.
      </p>

      {serverError && (
        <div className="mt-5 rounded-xl border border-[var(--coral)]/20 bg-[var(--coral)]/5 px-4 py-3 text-sm text-[var(--coral)]">
          {serverError}
        </div>
      )}

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <AuthField label="Full name" required icon={icons.patients} error={errors.fullName?.message} {...register("fullName")} />
        <AuthField label="Email" type="email" required icon={icons.email} error={errors.email?.message} {...register("email")} />

        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => (
            <PhoneNumberField
              label="Phone number"
              required
              brand
              value={field.value}
              onChange={field.onChange}
              error={errors.phoneNumber?.message}
            />
          )}
        />

        <AuthField
          label="Date of birth"
          type="date"
          required
          icon={icons.dateOfBirth}
          error={errors.dateOfBirth?.message}
          {...register("dateOfBirth")}
        />

        <div>
          <AuthField label="Password" type="password" required icon={icons.password} error={errors.password?.message} {...register("password")} />
          <div className="mt-2">
            <PasswordStrengthMeter password={password} />
          </div>
        </div>

        <AuthField
          label="Confirm password"
          type="password"
          required
          icon={icons.password}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <AuthButton type="submit" loading={submitting} className="mt-2">
          Create account
        </AuthButton>
      </form>

      <p className="mt-8 text-sm text-[var(--mist)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--teal)] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
