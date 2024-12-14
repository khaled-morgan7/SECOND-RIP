const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('travel.db')

// AUTOINCREMENT BT5LY EL ID YCOUNT LW7DO 
// NOT NULL MEANS CANNOT BE EMPTY
// UNIQUE MEANS MUST BE NAMED ONCE
// INT (IS ADMIN) => BOOLEAN, INTEGER, FLOAT, DOUBLE, OR NOT YT DEFINED

const createUserTable = `
    CREATE TABLE IF NOT EXISTS USER (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        NAME TEXT NOT NULL,
        EMAIL TEXT NOT NULL UNIQUE,
        PASS TEXT NOT NULL,
        ISADMIN INT
    );`;

// Create TICKET table
const createTicketTable = `
   CREATE TABLE IF NOT EXISTS TICKET (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      ORIGIN TEXT NOT NULL,
      DESTINATION TEXT NOT NULL,
      DATE TEXT NOT NULL,
      QUANTITY INTEGER NOT NULL,
      PRICE INTGER NOT NULL
    );`;

// Create BOOKING table
const createBookingTable = `
   CREATE TABLE IF NOT EXISTS BOOKINGS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER,
    TICKET_ID INTEGER,
    FOREIGN KEY (USER_ID) REFERENCES USER (ID),
    FOREIGN KEY (TICKET_ID) REFERENCES TICKET (ID)
    );`;

    // Create Feedback Table 
const createFeedbackTable = `
    CREATE TABLE IF NOT EXISTS FEEDBACK (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER NOT NULL,
    MESSAGE TEXT NOT NULL,
    FOREIGN KEY (USER_ID) REFERENCES USERS (ID)
    );`;

// exports data of db, and tables all alone
module.exports = { db, createUserTable, createBookingTable, createTicketTable, createFeedbackTable }