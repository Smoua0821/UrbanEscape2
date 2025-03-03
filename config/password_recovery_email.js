require("dotenv").config();

const password_recovery_email = (userName, userEmail, token) => {
  return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Recovery</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 500px;
              background: #ffffff;
              padding: 20px;
              margin: 30px auto;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              text-align: center;
          }
          h2 {
              color: #333;
          }
          p {
              color: #555;
              font-size: 16px;
          }
          .button {
              display: inline-block;
              background: #007BFF;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 20px;
              border-radius: 5px;
              font-weight: bold;
              margin-top: 15px;
          }
          .button:hover {
              background: #0056b3;
          }
          .footer {
              margin-top: 20px;
              font-size: 14px;
              color: #777;
          }
      </style>
    </head>
    <body>
        <div class="container">
            <h2>Password Recovery for ${userName}</h2>
            <p>Hi <b>${userName}</b>,</p>
            <p>We received a request to reset the password for your account associated with the email address <b>${userEmail}</b>.</p>
            <p>If you made this request, click the button below to reset your password:</p>
            <a href="${process.env.BASE_URL}/auth/password/recovery/verify/${token}" class="button">Reset Password</a>
            <p>If you didn’t request a password reset, you can safely ignore this email.</p>
            <p class="footer">For security reasons, this link will expire in 60 minutes. If you need further assistance, please contact our support team.</p>
        </div>
    </body>
    </html>`;
};

module.exports = password_recovery_email;
