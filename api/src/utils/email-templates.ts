function generateEmailHtml(magicLinkUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Sign in to USA Presence Calculator</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .security-note { background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin-top: 24px; }
          .footer { margin-top: 32px; font-size: 14px; color: #6B7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Sign in to USA Presence Calculator</h1>
          <p>Click the button below to securely sign in to your account:</p>
          <p style="margin: 24px 0;">
            <a href="${magicLinkUrl}" class="button">Sign In</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${magicLinkUrl}</p>
          
          <div class="security-note">
            <strong>🔒 Security Notice:</strong>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>This link expires in 15 minutes</li>
              <li>It can only be used once</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This email was sent from USA Presence Calculator. For security reasons, we'll never ask for your password via email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateEmailText(magicLinkUrl: string): string {
  return `Sign in to USA Presence Calculator

Click this link to sign in to your account:
${magicLinkUrl}

This link expires in 15 minutes and can only be used once.

If you didn't request this, please ignore this email.

This email was sent from USA Presence Calculator. For security reasons, we'll never ask for your password via email.`;
}

export function generateMagicLinkEmailContent(magicLinkUrl: string): {
  html: string;
  text: string;
} {
  return {
    html: generateEmailHtml(magicLinkUrl),
    text: generateEmailText(magicLinkUrl),
  };
}
