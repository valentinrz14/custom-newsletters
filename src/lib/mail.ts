import nodemailer from "nodemailer";

export async function sendMail() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: "Feed Bot",
    to: process.env.MAIL_TO,
    subject: "Resumen semanal",
    text: "Tu resumen semanal ya esta listo.",
  });
}
