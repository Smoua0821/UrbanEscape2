const Buttons = require("../../models/Buttons");

const fetchAllButtons = async (req, res) => {
  try {
    const buttons = await Buttons.find();
    return res.json(buttons);
  } catch (error) {
    console.error(error);
    return res.status(500).send("An error occurred!");
  }
};

const findButton = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send("Invalid request!");

  try {
    const button = await Buttons.findOne({ name });
    if (!button) return res.status(404).send("Button not found!");
    return res.json(button);
  } catch (error) {
    console.error(error);
    return res.status(500).send("An error occurred!");
  }
};

const deleteButton = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send("Invalid request!");

  try {
    const result = await Buttons.deleteOne({ name });
    if (result.deletedCount === 0)
      return res.status(404).send("Button not found!");
    return res.json({ status: "success", message: "Button Deleted!" });
  } catch (error) {
    console.error(error);
    return res.status(500).send("An error occurred!");
  }
};

const createButton = async (req, res) => {
  const { name, text, link } = req.body;

  if (!name || !text || !link) {
    return res.status(400).send("Name, text, and link are required!");
  }

  try {
    const button = await Buttons.findOneAndUpdate(
      { name },
      { $set: { text, link } },
      { new: true, upsert: true }
    );

    const message = button.isNew ? "Button created!" : "Button updated!";
    return res.status(button.isNew ? 201 : 200).json({
      status: "success",
      message,
      button,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("An error occurred!");
  }
};

module.exports = { fetchAllButtons, findButton, deleteButton, createButton };
