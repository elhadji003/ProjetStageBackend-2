const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const upload = require("../middlewares/upload");

// Public routes
router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);

// Protected routes (auth required)
router.use(userController.verifyToken);
router.get("/me", userController.me);
router.patch("/profile", upload.single("avatar"), userController.updateProfile);
router.patch("/password", userController.updatePassword);

module.exports = router;
