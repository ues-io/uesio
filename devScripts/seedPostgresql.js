const { Pool, Client } = require('pg')
const {} import "apps.js"
 
const DB_CONFIG = {
	user : "postgres",
	host: "localhost",
    database : "test-cf94a",
    password: "postgrestcm",
    port: 5432,
};


const pool = new Pool(DB_CONFIG);

/*pool.query('SELECT * FROM apps', (err, res) => {
    console.log(err, res)
    pool.end()
  })*/

const client = new Client(DB_CONFIG)

client.connect();

// create apps tables

client.query('DROP TABLE IF EXISTS `apps`;', (err, res) => {
    console.log(err, res);
    client.end();
})



client.query('SELECT * FROM apps', (err, res) => {
    console.log(err, res);
    client.end();
})