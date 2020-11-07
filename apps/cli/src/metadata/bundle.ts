import { LoadRequestField } from "../wire/loadrequest"
import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer = require("inquirer")
import {getApp, getWorkspace, getSessionId} from "../config/config"
import { get } from "../request/request"
import {authorize} from "../auth/login";

//TODO: probably don't want to leave it this way. :)
const UESIO_STUDIO_WORKSPACE = 'workspace'
const UESIO_BUNDLE_CREATE_ENDPOINT = 'metadata/storebundle'
class Bundle {
	static getCollectionName(): string {
		return "uesio.bundles"
	}
	static getFields(): LoadRequestField[] {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "uesio.namespace",
			},
			{
				id: "uesio.major",
			},
			{
				id: "uesio.minor",
			},
			{
				id: "uesio.patch",
			},
		]
	}
	static getColumns(): TableColumn[] {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "uesio.namespace",
			},
			{
				id: "uesio.major",
			},
			{
				id: "uesio.minor",
			},
			{
				id: "uesio.patch",
			},
		]
	}
	static async list(): Promise<void> {
		const response = await load(this)
		wiretable(response.wires[0], response.collections, this.getColumns())
	}
	static async create(): Promise<void> {

		const responses = await inquirer.prompt([

			{
				name: "version",
				message: "Bundle Version (Ex: v0.0.1)",
				type: "input",
			},
			{
				name: "description",
				message: "Description",
				type: "input",
			},
		])
		throwIfBadFormat(responses.version);
		const {cookie} = await authorize()

		const [workspace , app ]= await Promise.all([getWorkspace(), getApp(), getSessionId()])
		const url = `${UESIO_STUDIO_WORKSPACE}/${app}/${workspace}/${UESIO_BUNDLE_CREATE_ENDPOINT}?version=${responses.version}&description=${responses.description}`
		try {
			await get(url, cookie)
		} catch(e) {
			console.log(e);
		}
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

export { Bundle }
