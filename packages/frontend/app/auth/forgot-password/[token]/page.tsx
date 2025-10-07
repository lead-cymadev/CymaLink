import { redirect } from "next/navigation";

export default function LegacyResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  const token = params.token;
  redirect(`/auth/reset-password?token=${encodeURIComponent(token)}`);
}
