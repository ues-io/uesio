import { LoadRequestField } from "../wire/loadrequest"
import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer = require("inquirer")
import { save, createChange } from "../wire/save"
import {getApp} from "../config/config";

class Site {
	static getCollectionName(): string {
		return "uesio.sites"
	}
	static getFields(): LoadRequestField[] {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "uesio.name",
			},
			{
				id: "uesio.appref",
			},
			{
				id: "uesio.versionref",
			},
		]
	}
	static getColumns(): TableColumn[] {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "uesio.name",
			},
			{
				id: "uesio.appref",
			},
			{
				id: "uesio.versionref",
			},
		]
	}
	static async list(): Promise<void> {
		const response = await load(this)
		wiretable(response.wires[0], response.collections, this.getColumns())
	}
	static async create(): Promise<void> {
		const app = await getApp();

		const responses = await inquirer.prompt([
			{
				name: "name",
				message: "Site Name",
				type: "input",
			},
			{
				name: "version",
				message: "Bundle version (Ex: v0.0.1)",
				type: "input",
			}
		])
		throwIfBadFormat(responses.version)
		await save(
			this,
			createChange([
				{
					"uesio.name": responses.name,
					"uesio.bundleid": `${app}_${responses.version}`,
					"uesio.appref": app,
					"uesio.versionref": responses.version
				},
			])
		)
	}
}
function throwIfBadFormat(version: string) {
	const errorFormat = Error("Version must be formatted like so: \"v#.#.#\" Provided: " + version);
	if(version[0] !== 'v') throw errorFormat
	const parts = version.slice(1).split('.')
	if(parts.length !== 3) {
		throw errorFormat
	}
	const major = parseInt(parts[0]);
	const minor = parseInt(parts[1]);
	const patch = parseInt(parts[2]);
	if(isNaN(major) || isNaN(minor) || isNaN(patch)) {
		throw errorFormat;
	}
}
export { Site }
