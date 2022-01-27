import { LoadRequestBatch } from "../load/loadrequest"
import { LoadResponseBatch } from "../load/loadresponse"
import { LoginRequest, LoginResponse } from "../auth/auth"
import { SaveRequestBatch } from "../load/saverequest"
import { SaveResponseBatch } from "../load/saveresponse"
import { Context } from "../context/context"
import {
	MetadataListStore,
	MetadataType,
	METADATA,
} from "../bands/builder/types"
import { RouteState } from "../bands/route/types"
import { ImportSpec } from "../definition/definition"

type BotParams = {
	[key: string]: string
}

type BotResponse = {
	success: boolean
	error: string
}

type ConfigValueResponse = {
	name: string
	namespace: string
	value: string
	managedby: string
}

type SecretResponse = {
	name: string
	namespace: string
	managedby: string
	value: string
}

type FeatureFlagResponse = {
	name: string
	namespace: string
	value: boolean
	user: string
}

type JobResponse = {
	id: string
}

const getPrefix = (context: Context) => {
	const workspace = context.getWorkspace()
	if (workspace) {
		return `/workspace/${workspace.app}/${workspace.name}`
	}
	const siteadmin = context.getSiteAdmin()
	if (siteadmin) {
		return `/siteadmin/${siteadmin.app}/${siteadmin.name}`
	}
	return "/site"
}

const postJSON = (url: string, body?: Record<string, unknown>) =>
	fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		...(body && {
			body: JSON.stringify(body),
		}),
	})

const platform = {
	getView: async (context: Context, namespace: string, name: string) => {
		const prefix = getPrefix(context)
		const response = await fetch(`${prefix}/views/${namespace}/${name}`)
		if (response.status !== 200) {
			throw new Error("View Not Found")
		}
		return response.text()
	},
	getTheme: async (context: Context, namespace: string, name: string) => {
		const prefix = getPrefix(context)
		const response = await fetch(`${prefix}/themes/${namespace}/${name}`)
		if (response.status !== 200) {
			throw new Error("Theme Not Found")
		}
		return response.text()
	},
	getRoute: async (
		context: Context,
		namespace: string,
		route: string
	): Promise<RouteState> => {
		const prefix = getPrefix(context)
		const response = await fetch(`${prefix}/routes/${namespace}/${route}`)
		if (response.status !== 200) {
			throw new Error("Route Not Found")
		}
		return response.json()
	},
	loadData: async (
		context: Context,
		requestBody: LoadRequestBatch
	): Promise<LoadResponseBatch> => {
		const prefix = getPrefix(context)
		const response = await postJSON(`${prefix}/wires/load`, requestBody)
		if (response.status !== 200) {
			const error = await response.text()
			throw new Error(error)
		}
		return response.json()
	},
	saveData: async (
		context: Context,
		requestBody: SaveRequestBatch
	): Promise<SaveResponseBatch> => {
		const prefix = getPrefix(context)
		const response = await postJSON(`${prefix}/wires/save`, requestBody)
		if (response.status !== 200) {
			const error = await response.text()
			throw new Error(error)
		}
		return response.json()
	},
	callBot: async (
		context: Context,
		namespace: string,
		name: string,
		params: BotParams
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const response = await postJSON(
			`${prefix}/bots/call/${namespace}/${name}`,
			params
		)
		if (response.status !== 200) {
			const error = await response.text()
			return {
				success: false,
				error,
			}
		}
		return response.json()
	},
	getFileURL: (context: Context, namespace: string, name: string) => {
		const prefix = getPrefix(context)
		return `${prefix}/files/${namespace}/${name}`
	},
	getUserFileURL: (context: Context, userfileid: string) => {
		const prefix = getPrefix(context)
		return `${prefix}/userfiles/download?userfileid=${encodeURIComponent(
			userfileid
		)}`
	},
	uploadFile: async (
		context: Context,
		fileData: File,
		collectionID: string,
		recordID: string,
		fieldID: string
	): Promise<string> => {
		const prefix = getPrefix(context)
		const url = `${prefix}/userfiles/upload`
		const params = new URLSearchParams()
		params.append("name", fileData.name)
		params.append("collectionid", collectionID)
		params.append("recordid", recordID)
		params.append("fieldid", fieldID)

		const response = await fetch(url + "?" + params.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
			},
			body: fileData,
		})

		return response.json()
	},
	deleteFile: async (
		context: Context,
		userFileID: string
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const url = `${prefix}/userfiles/delete/${userFileID}`
		const response = await fetch(url, {
			method: "POST",
		})
		return response.json()
	},
	getComponentPackURL: (
		context: Context,
		namespace: string,
		name: string,
		buildMode: boolean
	) => {
		const prefix = getPrefix(context)
		const buildModeSuffix = buildMode ? "/builder" : ""
		return `${prefix}/componentpacks/${namespace}/${name}${buildModeSuffix}`
	},
	getMetadataList: async (
		context: Context,
		metadataType: MetadataType,
		namespace: string,
		grouping?: string
	): Promise<MetadataListStore> => {
		const prefix = getPrefix(context)
		const mdType = METADATA[metadataType]
		const groupingUrl = grouping ? `/${grouping}` : ""
		const response = await fetch(
			`${prefix}/metadata/types/${mdType}/namespace/${namespace}/list${groupingUrl}`
		)
		return response.json()
	},
	getCollectionMetadata: async (
		context: Context,
		collectionName: string
	): Promise<LoadResponseBatch> => {
		const prefix = getPrefix(context)
		const response = await fetch(
			`${prefix}/collections/meta/${collectionName}`
		)
		return response.json()
	},
	getAvailableNamespaces: async (
		context: Context,
		metadataType?: MetadataType
	): Promise<MetadataListStore> => {
		const prefix = getPrefix(context)
		const mdType = metadataType && METADATA[metadataType]
		const mdTypeUrl = mdType ? `/${mdType}` : ""
		const response = await fetch(
			`${prefix}/metadata/namespaces${mdTypeUrl}`
		)
		return response.json()
	},
	getConfigValues: async (
		context: Context
	): Promise<ConfigValueResponse[]> => {
		const prefix = getPrefix(context)
		const response = await fetch(`${prefix}/configvalues`)
		return response.json()
	},
	setConfigValue: async (
		context: Context,
		key: string,
		value: string
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const response = await postJSON(`${prefix}/configvalues/${key}`, {
			value,
		})
		return response.json()
	},
	getSecrets: async (context: Context): Promise<SecretResponse[]> => {
		const prefix = getPrefix(context)
		const response = await fetch(`${prefix}/secrets`)
		return response.json()
	},
	setSecret: async (
		context: Context,
		key: string,
		value: string
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const response = await postJSON(`${prefix}/secrets/${key}`, {
			value,
		})
		return response.json()
	},
	getFeatureFlags: async (
		context: Context,
		user?: string
	): Promise<FeatureFlagResponse[]> => {
		const prefix = getPrefix(context)
		const userUrl = user ? `/${user}` : ""
		const response = await fetch(`${prefix}/featureflags${userUrl}`)
		return response.json()
	},
	setFeatureFlag: async (
		context: Context,
		key: string,
		value: boolean,
		user?: string
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const response = await postJSON(`${prefix}/featureflags/${key}`, {
			value,
			user,
		})
		return response.json()
	},
	login: async (requestBody: LoginRequest): Promise<LoginResponse> => {
		const response = await postJSON("/site/auth/login", requestBody)
		return response.json()
	},
	logout: async (): Promise<LoginResponse> => {
		const response = await postJSON("/site/auth/logout")
		return response.json()
	},
	createImportJob: async (
		context: Context,
		spec: ImportSpec
	): Promise<JobResponse> => {
		const prefix = getPrefix(context)
		const url = `${prefix}/bulk/job`
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				"uesio.filetype": spec.filetype,
				"uesio.collection": spec.collection,
				"uesio.upsertkey": spec.upsertkey,
				"uesio.mappings": spec.mappings,
			}),
		})
		return response.json()
	},
	importData: async (
		context: Context,
		fileData: File,
		jobId: string
	): Promise<Response> => {
		const prefix = getPrefix(context)
		const url = `${prefix}/bulk/job/${jobId}/batch`

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
			},
			body: fileData,
		})

		return response
	},
}

type Platform = typeof platform

export {
	platform,
	Platform,
	BotResponse,
	BotParams,
	ConfigValueResponse,
	SecretResponse,
	FeatureFlagResponse,
	JobResponse,
}
