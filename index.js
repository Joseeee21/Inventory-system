const express = require('express')
const app = express(); 
const port = 8000; 
var bodyParser = require("body-parser")

app.use(bodyParser.urlencoded({ extended: true}));
app.set('view engine', 'ejs') // -> use ejs for rendering
app.use(express.static(__dirname + '/public')) // set location of static files

// setup SQLite 
const sqlite3 = require('sqlite3').verbose(); 
global.db = new sqlite3.Database('./database.db', function(err){
    if(err){
        console.error(err);
        process.exit(1);
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); 
    }
}); 

// Hashing password for account creation 
const session = require('express-session'); 

app.use(session({
    secret: 'inventorySystem',
    resave: false,
    saveUninitialized: true
})); 

const userRoutes = require('./routes/users');
app.use('/', userRoutes); 

app.listen(port, () => {
    console.log(`Inventory app listening on port ${port}`)
})