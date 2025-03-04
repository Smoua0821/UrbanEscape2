require("dotenv").config();

const password_recovery_email = (userName, userEmail, token) => {
  return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Update Your Password</title>
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
              background: #28a745;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 20px;
              border-radius: 5px;
              font-weight: bold;
              margin-top: 15px;
          }
          .button:hover {
              background: #218838;
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
            <h2>Password Update Request</h2>
            <p>Hi <b>${userName}</b>,</p>
            <p>We received a request to update the password for your account linked to <b>${userEmail}</b>.</p>
            <p>If this was you, click the button below:</p>
            <a href="${process.env.BASE_URL}/auth/password/recovery/verify/${token}" class="button">Update Password</a>
            <p>If you didn’t request this, feel free to ignore this email.</p>
            <p class="footer">Need help? <a href="${process.env.BASE_URL}/support">Contact Support</a></p>
        </div>
    </body>
    </html>`;
};

module.exports = password_recovery_email;
