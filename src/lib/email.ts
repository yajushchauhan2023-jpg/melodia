import { Resend } from "resend";
import { requiredEnv } from "./env";

const resend = new Resend(requiredEnv("RESEND_API_KEY"));

export async function sendEmail(to: string, subject: string, html: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM || "Melodia <billing@melodia.example>",
    to,
    subject,
    html
  });
}
