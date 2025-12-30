import { sendMail } from "@/src/lib/mail";

export async function GET() {
  await sendMail();

  return Response.json({ ok: true });
}
