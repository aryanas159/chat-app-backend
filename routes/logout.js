const express = require('express')
const router = express.Router()
router.post('/', (req, res) => {
    if (req?.cookies?.token) {
        res.cookie('token', '', {
            sameSite: "none",
            secure: true,
            httpOnly: true,
        }).status(200).json({'message': 'Logout successful'})
    }
})
module.exports = router;