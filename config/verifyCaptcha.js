const axios = require("axios");
require("dotenv").config();

const verifyCaptcha = async (gRecaptchaResponse) => {
  try {
    const secretKey = process.env.CAPTCHA_SECRET_KEY;

    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: secretKey,
          response: gRecaptchaResponse,
        },
      }
    );

    const { success } = response.data;

    if (success) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = verifyCaptcha;
