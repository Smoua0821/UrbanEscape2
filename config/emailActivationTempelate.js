require("dotenv").config();
const html_data = (codeId) => {
  return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
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
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up on <b>UrbanEscape</b>! Please confirm your email address by clicking the button below.</p>
            <a href="${process.env.BASE_URL}/auth/verify/${codeId}" class="button">Verify Email</a>
            <p>If you didn’t request this, you can ignore this email.</p>
            <p class="footer">If the button above doesn't work, copy and paste the following link in your browser:</p>
            <p class="footer">${process.env.BASE_URL}/auth/verify/${codeId}</p>
        </div>
    </body>
    </html>`;
};

module.exports = html_data;
