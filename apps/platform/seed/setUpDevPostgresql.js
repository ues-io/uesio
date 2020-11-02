const { Pool, Client } = require('pg');
const apps = require('./apps.json');
const bundles = require('./bundles.json');
const workspaces = require('./workspaces.json');
const { exec } = require('child_process');

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
const dropTablesPromise = client.query(
	'DROP TABLE IF EXISTS apps, bundles, workspaces;'
);
// create minimal tables for the app to work
const createTablesPromise = client.query(`
    CREATE TABLE apps(
        id TEXT,
        name TEXT,
        description TEXT,
        color TEXT
    );

    CREATE TABLE bundles(
        id TEXT,
        namespace TEXT,
        major TEXT,
        minor TEXT,
        patch TEXT,
        description TEXT
    );

    CREATE TABLE workspaces(
        id TEXT,
        name TEXT,
        appid TEXT
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


*/

const populateTable = (dbClient, tableName, records) => {
	return records.map((rowObject) => {
		// column id has the app's name
		const rowKeys = ['id', ...Object.keys(rowObject)];
		const rowValues = [rowObject['name'], ...Object.values(rowObject)];

		return dbClient.query(
			`INSERT INTO ${tableName}
            (${rowKeys.join()})
            VALUES(
                ${[...new Array(rowKeys.length)]
									.map((e, index) => `$${index + 1}`)
									.join()}
                );`,
			rowValues
		);
	});
};

const afterDataPopulation = (dbClient) => {
	dbClient.end();
	console.log('data populated and connection closed');
	// run the migration of the uesio cli
	exec('../../cli/bin/run migrate');
	console.log('migrate from uesio cli executed.');
};

// populate these tables
const appsPopulationPromises = populateTable(client, 'apps', apps);
const bundlesPopulationPromises = populateTable(client, 'bundles', bundles);
const workspacesPopulationPromises =
	[] || populateTable(client, 'workspaces', workspaces);

Promise.all([
	dropTablesPromise,
	createTablesPromise,
	...appsPopulationPromises,
	...bundlesPopulationPromises,
	...workspacesPopulationPromises,
]).then((results) => afterDataPopulation(client));
