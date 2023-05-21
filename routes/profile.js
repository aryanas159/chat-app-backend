const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
router.get('/', async (req, res) => {
    const token = req.cookies?.token
    if (token) {
        jwt.verify(token, process.env.JWT_TOKEN, {}, (err, data) => {
            if (err) throw err;
            return res.setHeader("Access-Control-Allow-Origin", "https://mern-chat-08hj.onrender.com").status(200).json(data)
        })
    }
    else {
        return res.setHeader("Access-Control-Allow-Origin", "https://mern-chat-08hj.onrender.com").status(404)
    }
})
module.exports = router;