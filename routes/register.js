const express = require('express')
const router = express.Router()
const User = require("../models/User");
const bcrypt = require("bcrypt");

router.post('/', async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ "message": "username and password is required" });
	}
	const anotherUser = await User.findOne({ username: username });
	if (anotherUser) {
		return res.status(409).json({ "message": "User is already registered" });
	}
	try {
		const hashPwd = await bcrypt.hash(password, 10);
		const newUser = await User.create({
			username: username,
			password: hashPwd,
		});

		return res
			.status(201) 
			.json(newUser);
	} catch (err) {
		console.log(err);
		return res.status(400).json({ "message": err.message });
	}
})

module.exports = router;