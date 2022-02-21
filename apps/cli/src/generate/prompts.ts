import { User } from "../auth/login"
import inquirer from "inquirer"
import { get, parseJSON } from "../request/request"
import { collection, metadata } from "#uesio/ui"
import { getMetadataList } from "../config/config"

type BotParam = {
	name: string
	prompt: string
	type?: string
	metadataType?: metadata.MetadataType
	grouping?: string
	default?: string
}

type PromptAnswers = Record<string, string>

type PromptRenderer = (
	param: BotParam,
	answers: PromptAnswers,
	app: string,
	version: string,
	user: User
) => Promise<PromptAnswers>

const mergeParam = (
	template: string | undefined,
	answers: PromptAnswers
): string => {
	if (!template) return ""
	return template.replace(
		/\$([.\w]*){(.*?)}/g,
		(x, mergeType, expression) => {
			if (mergeType === "Answer") {
				return answers[expression] || ""
			}
			return ""
		}
	)
}

const metadataNameValidator = (input: string) => {
	const errorMessage =
		"Failed metadata validation, no capital letters or special characters allowed: " +
		input
	const regex = new RegExp("^[a-z0-9_]+$")
	return regex.test(input) || errorMessage
}

const promptRenderers: Record<string, PromptRenderer> = {
	TEXT: async (param, answers) =>
		inquirer.prompt({
			name: param.name,
			message: param.prompt,
			type: "input",
			default: mergeParam(param.default, answers),
		}),
	METADATANAME: async (param) =>
		inquirer.prompt({
			name: param.name,
			message: param.prompt,
			type: "input",
			validate: metadataNameValidator,
		}),
	METADATA: async (param, answers, app, version, user) => {
		const metadataType = param.metadataType
		if (!metadataType) throw new Error("Bad Metadata Type: " + metadataType)
		const items = await getMetadataList(metadataType, app, version, user)
		return inquirer.prompt({
			name: param.name,
			message: param.prompt,
			type: "list",
			choices: items,
		})
	},
	METADATAMULTI: async (param, answers, app, version, user) => {
		const metadataType = param.metadataType
		if (!metadataType) throw new Error("Bad Metadata Type: " + metadataType)
		const items = await getMetadataList(
			metadataType,
			app,
			version,
			user,
			mergeParam(param.grouping, answers)
		)
		return inquirer.prompt({
			name: param.name,
			message: param.prompt,
			type: "checkbox",
			choices: items,
		})
	},
	FIELDTYPE: async (param) =>
		inquirer.prompt({
			name: param.name,
			message: param.prompt,
			type: "list",
			choices: collection.FIELD_TYPES,
		}),
}

const getPrompts = async (
	params: BotParam[],
	app: string,
	version: string,
	user: User
) => {
	let answers: PromptAnswers = {}
	for (const param of params) {
		const answer = await getNextPrompt(param, answers, app, version, user)
		answers = {
			...answers,
			...answer,
		}
	}
	return answers
}

const getNextPrompt = async (
	param: BotParam,
	answers: PromptAnswers,
	app: string,
	version: string,
	user: User
): Promise<PromptAnswers> => {
	// TODO: Possibly figure out conditional rendering here based on
	// more param metadata.
	const type = param.type || "TEXT"
	const renderer = promptRenderers[type]
	if (!renderer) {
		throw new Error("Bad Param Type: " + type)
	}
	return renderer(param, answers, app, version, user)
}

const getAnswers = async (
	app: string,
	version: string,
	namespace: string,
	name: string,
	user: User
) => {
	const paramsResponse = await get(
		`version/${app}/${namespace}/${version}/bots/params/generator/${name}`,
		user.cookie
	)
	return getPrompts(await parseJSON(paramsResponse), app, version, user)
}

export { getAnswers, PromptAnswers, metadataNameValidator }
