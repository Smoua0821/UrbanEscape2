const express = require("express");
const router = express.Router();
const { loginPage, loginValidate, newUser } = require("../controllers/login");
router.get("/", loginPage);

router.post("/", loginValidate);

router.post("/new", newUser);
module.exports = router;
