const Activity = require("../models/activities");

// GET tutti le attivita
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST crea attivita
exports.createActivity = async (req, res) => {
  try {
    const newActivity = new Activity(req.body);
    await newActivity.save();
    res.status(201).json(newActivity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/*
exports.createActivity = async (req, res) => {
  try {
    const newActivity = new Activity({
      title: req.body.title,
      description: req.body.description,
      activityDate: new Date(req.body.activityDate),
      maxParticipants: req.body.maxParticipants,

      status: "Aperto",

      organizerID: req.userId, 
      trekID: req.body.trekID, 
    });

    await newActivity.save();

    res.status(201).json(newActivity);

  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};
*/

exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findOne({id: parseInt(req.params.id)});
    if (!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }
    console.log("ID ricevuto:", req.params.id);
    console.log("Tipo:", typeof req.params.id);
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};