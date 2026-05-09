const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");

router.get("/", userController.getUsers);
router.post("/", userController.createUser);

//TODO: verificare il codice qui sotto
// import * as userController from '../controllers/user.controller';

// Router.post('/login', userController.loginOne);
// Router.post('/register', userController.registerOne);

module.exports = router;