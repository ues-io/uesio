const { Pool, Client } = require('pg');
const apps = require('./apps.json');
const bundles = require('./bundles.json');
const workspaces = require('./workspaces.json');
const { exec, execSync } = require('child_process');

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

const insertRow = (dbClient) => (tableName) => (rowObject) =>
	dbClient.query(
		`INSERT INTO ${tableName}
            (${Object.keys(rowObject).join()})
            VALUES(
                ${[...new Array(Object.keys(rowObject).length)]
									.map((e, index) => `$${index + 1}`)
									.join()}
                );`,
		Object.values(rowObject)
	);

const afterDataPopulation = (dbClient) => {
	dbClient.end();
	console.log('data populated and connection closed');
	// run the migration of the uesio cli

	exec(
		`
        cd ./libs/uesioapps/crm &&  ./../../../apps/cli/bin/run migrate
        `,
		(err, stdout, stderr) => {
			if (err) {
				//some err occurred
				console.error(err);
			} else {
				// the *entire* stdout and stderr (buffered)
				console.log(`stdout: ${stdout}`);
				console.log(`stderr: ${stderr}`);
			}
		}
	);
	console.log('migrate from uesio cli executed.');
};

// populate these tables
const appsPopulatePromises = apps
	.map((app) => ({
		...app,
		id: app['name'],
	}))
	.map(insertRow(client)('apps'));

const bundlesPopulatePromises = bundles
	.map((app) => ({
		...app,
		id: app.namespace + '_v0.0.1',
	}))
	.map(insertRow(client)('bundles'));

const workspacesPopulatePromises = workspaces
	.map((workspace) => ({
		id: workspace.app.name + '_' + workspace.name,
		appid: workspace.app.name,
		name: workspace.name,
	}))
	.map(insertRow(client)('workspaces'));

Promise.all([
	dropTablesPromise,
	createTablesPromise,
	...appsPopulatePromises,
	...bundlesPopulatePromises,
	...workspacesPopulatePromises,
]).then((results) => afterDataPopulation(client));
