const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
router.get('/', async (req, res) => {
    const token = req.cookies?.token
    if (token) {
        jwt.verify(token, process.env.JWT_TOKEN, {}, (err, data) => {
            if (err) throw err;
            return res.status(200).json(data)
        })
    }
    else {
        return res.status(404)
    }
})
module.exports = router;