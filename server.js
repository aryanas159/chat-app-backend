//Modules
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const ws = require("ws");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mongoose = require("mongoose");
const https = require("https");

const key = fs.readFileSync(path.join(__dirname, "private.key"));
const cert = fs.readFileSync(path.join(__dirname, "certificate.crt"));
const cred = {
	key,
	cert,
};

//Funtions and Models
const connectDB = require("./config/dbConnector");
const Message = require("./models/Message");

const PORT = process.env.PORT || 3000;
const app = express();
connectDB();

// app.use

app.use(express.json()); // To work with JSON
app.use(
	cors({
		credentials: true,
		origin: process.env.ORIGIN_URL,
	})
);
app.use(cookieParser());
app.use("/register", require("./routes/register"));
app.use("/login", require("./routes/login"));
app.use("/profile", require("./routes/profile"));
app.use("/messages", require("./routes/messages"));
app.use("/people", require("./routes/people"));
app.use("/logout", require("./routes/logout"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/test", (req, res) => {
	return res.json({ "message": "test" });
});

const buildPath = path.join(__dirname, "../chat-app-frontend/dist");
app.use(express.static(buildPath));
app.get("/*", (req, res) => {
	res.sendFile(path.join(buildPath, "index.html"), (err) => {
		if (err) {
			res.status(500).send(err);
		}
	});
});

mongoose.connection.once("open", () => {
	console.log("Connected to MongoDB");
});
const server = app.listen(PORT, () =>
	console.log(`server connected to port: ${PORT}`)
);

const httpsServer = https.createServer(cred, app);
httpsServer.listen(8443);

const wss = new ws.WebSocketServer({ server }); //New WebSocket defined
wss.on("connection", (connection, req) => {
	const notifyAboutOnlinePeople = () => {
		[...wss.clients].forEach((client) => {
			client.send(
				JSON.stringify({
					"online": [...wss.clients].map((c) => {
						return { "id": c.id, "username": c.username };
					}),
				})
			);
		});
	};

	connection.isAlive = true;

	connection.timer = setInterval(() => {
		connection.ping();
		connection.deathTimer = setTimeout(() => {
			connection.isAlive = false;
			clearInterval(connection.timer);
			connection.terminate();
			notifyAboutOnlinePeople();
			console.log("dead");
		}, 1000);
	}, 5000);

	connection.on("pong", () => {
		clearTimeout(connection.deathTimer);
	});

	const cookies = req.headers.cookie;
	if (cookies) {
		const token = cookies
			.split("; ")
			.find((str) => str.startsWith("token="))
			.split("=")[1];
		if (token) {
			jwt.verify(token, process.env.JWT_TOKEN, {}, (err, userData) => {
				if (err) throw err;
				const { username, id } = userData;
				connection.username = username;
				connection.id = id;
			});
		}
	}
	connection.on("message", async (message) => {
		const messageData = JSON.parse(message.toString());
		if (messageData?.receipient && messageData?.sender) {
			let fileName = messageData?.file?.name || null;
			if (messageData?.file) {
				const fileData = messageData.file;
				const base64Code = fileData.data.split(";base64,").pop();
				fs.writeFile(
					path.join(__dirname, "uploads", fileName),
					base64Code,
					{ encoding: "base64" },
					(err) => {
						if (err) throw err;
						console.log("file sent");
					}
				);
			}
			const messageDoc = await Message.create({
				sender: messageData.sender,
				receipient: messageData.receipient,
				text: messageData.text || null,
				file: fileName,
			});
			[...wss.clients]
				.filter((c) => c.id === messageData.receipient)
				.forEach((c) =>
					c.send(
						JSON.stringify({
							"message": {
								text: messageData.text,
								file: fileName,
								sender: messageData.sender,
								receipient: messageData.receipient,
								_id: messageDoc._id,
							},
						})
					)
				);
		}
	});

	// connection.on("close", () => {
	// 	notifyAboutOnlinePeople();
	// });
	notifyAboutOnlinePeople();
});

httpsServer.on("upgrade", (request, socket, head) => {
	console.log("upgrading")
	wss.handleUpgrade(request, socket, head, (ws) => {
		wss.emit("connection", ws, request);
	});
});

module.exports = app;
