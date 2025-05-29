const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// Clé secrète pour JWT (mettre en variable d'environnement en prod)
const JWT_SECRET = process.env.JWT_SECRET || "tonsecretjwt";

// Créer un utilisateur (inscription)
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, number, birthday } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }

    // Création de l'utilisateur avec les champs exacts
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      number,
      birthday,
    });

    await user.save();

    res.status(201).json({ message: "Utilisateur créé avec succès" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'email est fourni
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // Générer le token JWT
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

    // Nettoyer les données utilisateur avant renvoi
    const { password: pwd, __v, ...userData } = user._doc;

    res.json({
      message: "Connexion réussie",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("Erreur login:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Middleware pour protéger routes avec token JWT
exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer <token>
  if (!token)
    return res.status(401).json({ error: "Accès refusé, token manquant" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // stocker payload dans req.user
    next();
  } catch (err) {
    res.status(401).json({ error: "Token invalide" });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password -__v");

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mise à jour profil utilisateur avec image (upload avec multer)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { firstName, lastName, email, number, birthday } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (number) user.number = number;
    if (birthday) user.birthday = new Date(birthday);

    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;

    res.json({ message: "Profil mis à jour", user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Mot de passe actuel et nouveau requis" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Mot de passe actuel incorrect" });
    }

    user.password = newPassword;

    await user.save();

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
