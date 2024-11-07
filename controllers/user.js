const userProfile = async (req, res) => {
  const user = req.user;
  //   return res.status(200).json(user)
  return res.render("pages/profile", {
    user: user,
  });
};

module.exports = { userProfile };
