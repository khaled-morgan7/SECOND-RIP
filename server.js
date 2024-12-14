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

// for users
// no need for '' if int
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


// text must be in a '' like email and if password wanted to be a text
// login for admin
server.post('/user/login', (req, res) => {
    const email = req.body.email
    const password = req.body.pass

    // Fetch user details from the database using parameterized queries to prevent SQL injection
    db.get(`SELECT * FROM USER WHERE EMAIL = ?`, [email], (err, row) => {
        if (err || !row) {
            return res.status(401).send('Wrong email or password')
        }

        // Compare the provided password with the hashed password in the database
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

server.get('/users',verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const query = `SELECT * FROM USER`;
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error retrieving users');
        } else {
            return res.json(rows);
        }
    });
});

server.get('/user/email',verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const email = req.query.email;  // Email passed as a query parameter
    const query = `SELECT * FROM USER WHERE EMAIL = '${email}'`;
    db.get(query, (err, row) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else if (!row){
            return res.send(`this id ${req.params.email} is not found) `)} 
        
        else 
        {
            return res.send(row)
}})})
    
server.put('/user/profile', (req, res) => {
    const userID = req.body.userID;
    const name = req.body.name;
    const email = req.body.email;
    const query = `UPDATE USER SET NAME = '${name}', EMAIL = '${email}' WHERE ID = ${userID}`;
    db.run(query, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error updating profile');
        } else {
            return res.send('Profile updated successfully');
        }
    });
});

// LET A NEW STRING TO BE READABLE (query)
// parseInt change string to int
// base 10

server.delete('/tickets/:id',verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const query = `DELETE FROM TICKET WHERE ID = ${req.params.id}`;
    db.run(query, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error deleting ticket');
        } else {
            return res.send('Ticket deleted successfully');
        }
    });
});

server.post(`/ticket/add`,verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")

    const origin = req.body.origin
    const destination = req.body.destination
    const date = req.body.date
    const quantity = parseInt(req.body.quantity, 10)
    const price = parseInt(req.body.price, 10)
    let query = `INSERT INTO TICKET (ORIGIN, DESTINATION, DATE, QUANTITY, PRICE) VALUES ('${origin}', '${destination}', '${date}', ${quantity}, ${price})`
    db.run(query, (err) => {
        if (err) {
            console.log(err)
            return res.send(err)
        } else {
            return res.send(`Ticket added successfully`)
        }
    })
})

// db.all is to return all data 
// db.get is to return something unique
server.get(`/ticket`,verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const query = `SELECT * FROM TICKET`
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err)
            return res.send(err)
        } else
            return res.json(rows)
    })
})

// search identify the source
server.get(`/ticket/search/:id`, (req, res) => {
    const query = `SELECT * FROM TICKET WHERE ID=${req.params.id}`
    db.get(query, (err, row) => {
        if (err) {
            console.log(err)
            return res.send(err)
        } else if (!row) {
            return res.send(`Ticket with ID ${req.params.id} not found`)
        } else
            return res.send(row)
    })
})

// all edits are in the route params
server.put(`/ticket/edit/:id/:quantity`, (req, res) => {
    const query = `UPDATE TICKET SET QUANTITY= ${parseInt(req.params.quantity, 10)} WHERE ID = ${req.params.id}`
    db.run(query, (err) => {
        if (err) {
            console.log(err)
            return res.send(err)
        } else
            return res.send(`Ticket updated successfully`)
    })
})



// IF THE TICKET HAS NO PLACES SO IT DOES NOT APPEAR TO THE CLIENT
server.get(`/ticket/search`, (req, res) => {
    let origin = req.query.origin
    let destination = req.query.destination
    let date = req.query.date
    let query = `SELECT * FROM TICKET WHERE QUANTITY > 0`
    if (origin)
        query += ` AND ORIGIN='${origin}'`
    if (destination)
        query += ` AND DESTINATION='${destination}'`
    if (date)
        query += ` AND DATE='${date}'`
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err)
            return res.send(err)
        } else
            return res.json(rows)
    })
})

server.post('/booking', (req, res) => {
    const { userID, origin, destination, date } = req.body;

    if (!userID || !origin || !destination || !date) 
        return res.status(400).send('Missing required fields');

    db.get(`SELECT ID, QUANTITY FROM TICKET WHERE ORIGIN = ? AND DESTINATION = ? AND DATE = ?`, 
    [origin, destination, date], (err, ticket) => {
        if (err || !ticket || ticket.QUANTITY < 1) 
            return res.status(400).send('No tickets available');

        db.run(`INSERT INTO BOOKINGS (USER_ID, TICKET_ID) VALUES (?, ?)`, [userID, ticket.ID], (err) => {
            if (err) return res.status(500).send('Booking failed');

            db.run(`UPDATE TICKET SET QUANTITY = QUANTITY - 1 WHERE ID = ?`, [ticket.ID], (err) => {
                return err ? res.status(500).send('Ticket update failed') : res.send('Booking successful');
            });
        });
    });
});

server.get('/bookings',verifyToken,(req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const query = `SELECT * FROM BOOKINGS`; // Query to fetch all bookings

    db.all(query, (err, rows) => {
        if (err) {
            console.log(err); // Log the error
            return res.status(500).send('Error retrieving bookings'); // Send error response
        } else {
            return res.json(rows); // Send all bookings as JSON response
        }
    });
});


server.get('/bookings/:id', (req, res) => {
    const bookingID = req.params.id;
    const query = `SELECT * FROM BOOKINGS WHERE ID = ${bookingID}`;
    db.get(query, (err, row) => {
        if (err || !row) {
            console.log(err);
            return res.status(404).send('Booking not found');
        } else {
            return res.json(row);
        }
    });
});

server.delete('/bookings/:id',verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const bookingID = req.params.id;
    const query = `DELETE FROM BOOKINGS WHERE ID = ${bookingID}`;
    db.run(query, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error deleting booking');
        } else {
            return res.send('Booking canceled successfully');
        }
    });
});

server.post('/feedback', (req, res) => {
    const userID = req.body.userID;
    const message = req.body.message;
    const query = `INSERT INTO FEEDBACK (USER_ID,MESSAGE ) VALUES (${userID}, '${message}')`;
    db.run(query, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error submitting feedback');
        } else {
            return res.send('Feedback submitted successfully');
        }
    });
});

server.get('/feedback',verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    db.all( `SELECT * FROM FEEDBACK`,(err, row) => {
        if (err)
            return res.status(500).send('Error retrieving feedback');
        // if (!row || row.ISADMIN !== 1) 
        //     return res.status(403).send('Unauthorized: Only admins can view feedback');
           else 
            res.json(row);
        });
    });

server.delete('/feedback/:id',verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const feedbackID = req.params.id; // Extract feedback ID from the URL parameter
    const query = `DELETE FROM FEEDBACK WHERE ID = ${feedbackID}`; // SQL query to delete the feedback

    db.run(query, (err) => {
        if (err) {
            console.log(err); // Log the error
            return res.status(500).send('Error deleting feedback'); // Send error response
        } else {
            return res.send('Feedback deleted successfully'); // Send success response
        }
    });
});

// serialize handles multiple calls in the same process/.
// calls each one separately to avoid blocking
server.listen(port, () => {
    console.log(`server started at port ${port}`)
    db.serialize(() => {
        db.exec(db_access.createTicketTable)
        db.exec(db_access.createUserTable)
        db.exec(db_access.createBookingTable)
        db.exec(db_access.createFeedbackTable)
    })
})