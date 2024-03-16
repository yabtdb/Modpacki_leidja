const express = require('express');
const bodyParser = require('body-parser');
require("dotenv").config();
const mysql = require('mysql2');
const app = express();
const PORT = 3000;

const cors = require('cors');

// Use body-parser to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MySQL connection configuration
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.use(express.static('public'));
app.use(cors());
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.post('/autocomplete', (req, res) => {
    const inputText = req.body.input;

    // Perform a simple SQL query to fetch suggestions
    const query = `SELECT ModName FROM mods WHERE ModName LIKE '%${inputText}%' LIMIT 6`;
    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error fetching autocomplete suggestions:", error);
            res.status(500).json({ error: "Internal server error" });
            return;
        }
        
        // Process the result and send suggestions as JSON
        const suggestions = results.map(result => result.ModName);
        if (suggestions.length > 0) {
            // If there are suggestions, send them as JSON response
            res.json(suggestions);
        } else {
            // If there are no suggestions, send an empty array as JSON response
            res.json([]);
        }
    });
});


app.post('/modpacks', (req, res) => {
    const selectedMod = req.body.selectedMod;

    // Query the database to fetch modpacks that have the selected mod
    const query = `
        SELECT DISTINCT modpacks.ModpackName
        FROM modpacks
        JOIN modpackmods ON modpacks.ModpackID = modpackmods.ModpackID
        JOIN mods ON mods.ModID = modpackmods.ModID
        WHERE mods.ModName LIKE CONCAT('%', ?, '%')
        
    `;
    connection.query(query, [selectedMod], (error, results) => {
        if (error) {
            console.error("Error fetching modpacks:", error);
            res.status(500).json({ error: "Internal server error" });
            return;
        }
        
        // Send the modpack data as JSON response
        const modpacks = results.map(result => result.ModpackName);
        res.json(modpacks);
    });
});


app.listen(PORT, () => {
    console.log("Server is running");
});
