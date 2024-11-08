const userProfile = async (req, res) => {
  const user = req.user;
  console.log(user);
  return res.render("pages/profile", {
    user: user,
  });
};

module.exports = { userProfile };
