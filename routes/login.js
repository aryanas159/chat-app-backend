const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
	const { username, password } = req.body;
	if (!username || !password) {
		return res
			.status(400)
			.json({ "message": "username and password are required" });
			
	}
	const foundUser = await User.findOne({ username });
	if (!foundUser) {
		return res.status(404).json({ "message": "User not found" });
	}
	const auth = await bcrypt.compare(password, foundUser.password);
	if (auth) {
		jwt.sign(
			{
				id: foundUser._id,
				username: foundUser.username,
			},
			process.env.JWT_TOKEN,
			{},
			(err, token) => {
				if (err) throw err;
				res.cookie("token", token, {
						sameSite: "none",
						secure: true,
						httpOnly: false
					})
					.status(200)
					.json(foundUser);
					
			}
		);
	} else {
		res.status(401).json({ "message": "Incorrect password" });
	}
});

module.exports = router;
