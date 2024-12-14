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
server.post('/user/register', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const pass = req.body.pass;

    // Hash the password
    bcrypt.hash(pass, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send('Error hashing password');
        }

        // Query to insert the new user
        const query = `INSERT INTO USER (NAME, EMAIL, PASS, ISADMIN) VALUES (?, ?, ?, ?)`;

        // Execute the query
        db.run(query, [name, email, hashedPassword, 0], (err) => {
            if (err) {
                return res.status(401).send(err.message);
            } else {
                return res.status(200).send('Registration successful');
            }
        });
    });
});

server.post('/user/login', (req, res) => {
    const email = req.body.email
    const password = req.body.pass

    // Fetch user details from the database using parameterized queries to prevent SQL injection
    db.get(`SELECT * FROM USER WHERE EMAIL = ?`, [email], (err, row) => {
        if (err || !row) {
            return res.status(401).send('Wrong email or password')
        }

        bcrypt.compare(password, row.PASS, (err, isMatch) => {
            if (err) {
                return res.status(500).send('Error comparing password')
            }

            if (!isMatch) {
                return res.status(401).send('Invalid credentials')
            } else {
                // Generate JWT token on successful login
                const userID = row.ID
                const isAdmin = row.ISADMIN
                const token = generateToken(userID, isAdmin)

                // Send token as a cookie to the client for authentication
                res.cookie('authToken', token, {
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true,
                    expiresIn: '1h'
                })

                return res.status(200).json({ id: userID, admin: isAdmin })
            }
        })
    })
})
