const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const jwt = require("jsonwebtoken");

router.get("/:id", async (req, res) => {
	const id = req.params.id;
	const token = req?.cookies?.token;
	let ourId = "";
	if (token) {
		jwt.verify(token, process.env.JWT_TOKEN, {}, (err, userData) => {
			if (err) throw err;
			if (userData?.id) ourId = userData.id;
		});
	}
	if (id) {
		const messagesOfSelectedUser = await Message.find({
			sender: { $in: [id, ourId] },
			receipient: { $in: [id, ourId] },
		}).sort();
		return res.status(200).json(messagesOfSelectedUser);
	}
    return res.sendStatus(404)
	
});

module.exports = router;