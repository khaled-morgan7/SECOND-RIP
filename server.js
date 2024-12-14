const express = require('express')                                      //library for java 
const cors = require('cors');                                          //connect between fornt and back end 
const db_access = require('./db.js')                                  //
const jwt = require('jsonwebtoken')                                  // generate token for the admin
const bcrypt = require('bcrypt');                                   // hashing 
const db = db_access.db                                            //
const cookieParser = require('cookie-parser');                    // generate cookies
const server = express()
const secret_key = 'poiuytrewqlkjhgfdsamnbvcxz'                 // encrypt the hash 
const port = 5555
server.use(cors({
    origin:"http://localhost:3000",                           // http for react( fornt end)
    credentials:true
}))
server.use(express.json())                                  // bdl using body parser 
server.use(cookieParser())
const generateToken = (id, isAdmin) => {
    return jwt.sign({ id, isAdmin }, secret_key, { expiresIn: '24h' })
}
const verifyToken = (req, res, next) => {
    const token = req.cookies.authToken
    if (!token)
        return res.status(401).send('unauthorized')
    jwt.verify(token, secret_key, (err, details) => {
        if (err)
            return res.status(403).send('invalid or expired token')
        req.userDetails = details

        next()
    })
}
