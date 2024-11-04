async function adminPage(req, res) {
  res.render("pages/admin", {
    apiKey: "AIzaSyBaQ334LSpDNZXU8flkT1VjGpdj7f3_BZI",
  });
}
module.exports = { adminPage };
