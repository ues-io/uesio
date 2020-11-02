const { Pool, Client } = require('pg');
const apps = require('./apps.json');
const bundles = require('./bundles.json');
// const apps = require('./workspaces.jon');

const DB_CONFIG = {
	user: 'postgres',
	host: 'localhost',
	database: 'test-cf94a',
	password: 'postgrestcm',
	port: 5432,
};

const client = new Client(DB_CONFIG);

client.connect();

// remove tables if they do exist
client.query('DROP TABLE IF EXISTS apps, bundles;');
// create minimal tables for the app to work
client.query(`
    CREATE TABLE apps(
        id TEXT,
        name TEXT,
        description TEXT,
        color TEXT
    );
`);
client.query(`
    CREATE TABLE bundles(
        id TEXT,
        namespace TEXT,
        major TEXT,
        minor TEXT,
        patch TEXT,
        description TEXT
    );
`);
/*
client.query(`
    CREATE TABLE accounts(
        id PRIMARY KEY TEXT,
        name TEXT,
        description TEXT,
        externalid TEXT,
        profilepic TEXT
    );
`);

client.query(`
    CREATE TABLE contacts(
        id PRIMARY KEY TEXT,
        birthdate TEXT,
        first_name TEXT,
        gender TEXT,
        last_name TEXT,
        accountid TEXT,
        externalid TEXT,
        account TEXT,
        deceased TEXT
    );
`);

client.query(`
    CREATE TABLE workspaces(
        id TEXT,
        name TEXT,
        appid TEXT
    );
`);
*/

const populateTable = (dbClient, tableName, collection) => {
	return collection.map((rowObject) => {
		const rowKeys = Object.keys(rowObject);
		const rowValues = Object.values(rowObject);

		return dbClient.query(
			`INSERT INTO ${tableName}
            (${rowKeys.join()})
            VALUES(
                ${[...new Array(rowKeys.length)]
									.map((e, index) => `$${index + 1}`)
									.join()}
                ) RETURNING *`,
			rowValues
		);
	});
};

const afterPopulation = (dbClient) => {
	dbClient.end();
};

// populate these tables
const appsQueryPromises = populateTable(client, 'apps', apps);
const bundlesQueryPromises = populateTable(client, 'bundles', bundles);

Promise.all([...appsQueryPromises, ...bundlesQueryPromises]).then((results) =>
	afterPopulation(client)
);
