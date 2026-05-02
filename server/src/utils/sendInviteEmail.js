import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an invite email with a code using Resend
 * @param {string} to - Recipient email address
 * @param {string} code - Invitation code
 * @returns {Promise<object>} Resend API response
 */
export async function sendInviteEmail(to, code) {
    return resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to,
        subject: 'Your Invite Code',
        html: `<p>Your invite code is: <strong>${code}</strong></p>`
    });
}