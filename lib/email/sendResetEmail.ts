import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: 'Cyberpunk TCG <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your password — Cyberpunk TCG Simulator',
      html: `
        <div style="background:#0a0a12;color:#e0e8f0;padding:40px;font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
          <h1 style="color:#00f0ff;font-size:28px;margin-bottom:8px;">CYBERPUNK TCG</h1>
          <p style="color:#7a8a9a;font-size:12px;letter-spacing:3px;margin-bottom:30px;">PASSWORD RESET</p>
          <div style="height:1px;background:linear-gradient(to right,#00f0ff,#ff003c,transparent);margin-bottom:30px;"></div>
          <p style="margin-bottom:20px;">Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#111119;border:1px solid #00f0ff;color:#00f0ff;text-decoration:none;font-size:14px;letter-spacing:2px;">RESET PASSWORD</a>
          <p style="margin-top:30px;color:#444;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}
