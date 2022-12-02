import { LoadRequestBatch } from "../load/loadrequest"
import { LoadResponseBatch } from "../load/loadresponse"
import { SaveRequestBatch } from "../load/saverequest"
import { SaveResponseBatch } from "../load/saveresponse"
import { Context } from "../context/context"
import { MetadataType, METADATA } from "../bands/builder/types"
import { Dependencies, RouteState } from "../bands/route/types"
import { Spec } from "../definition/definition"
import { parseKey } from "../component/path"
import { PlainWireRecord } from "../bands/wirerecord/types"
import { ParamDefinition } from "../definition/param"
import { UserState } from "../bands/user/types"

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

type PathNavigateRequest = {
	namespace: string
	path: string
}

type CollectionNavigateRequest = {
	collection: string
	viewtype?: string
	recordid?: string
}

type MetadataInfo = {
	color: string
	icon: string
}

type NavigateRequest = PathNavigateRequest | CollectionNavigateRequest

type LoginResponse = LoginResponsePath | LoginResponseRedirect

type LoginResponsePath = {
	user: UserState
	redirectPath: string
}

type LoginResponseRedirect = {
	user: UserState
	redirectRouteNamespace: string
	redirectRouteName: string
}

const getPrefix = (context: Context) => {
	const workspace = context.getWorkspace()
	if (workspace && workspace.app && workspace.name) {
		return `/workspace/${workspace.app}/${workspace.name}`
	}
	const siteadmin = context.getSiteAdmin()
	if (siteadmin) {
		return `/siteadmin/${siteadmin.app}/${siteadmin.name}`
	}
	return "/site"
}

const isPathRouteRequest = (
	request: NavigateRequest
): request is PathNavigateRequest => "path" in request

const isCollectionRouteRequest = (
	request: NavigateRequest
): request is CollectionNavigateRequest => "collection" in request

const getRouteUrl = (context: Context, request: NavigateRequest) => {
	const prefix = getPrefix(context)
	if (isPathRouteRequest(request)) {
		// This is the namespace of the viewdef in context. We can assume if a namespace isn't
		// provided, they want to navigate within the same namespace.
		const viewDefId = context.getViewDefId() || ""
		const [viewDefNamespace] = parseKey(viewDefId)
		const namespace = request.namespace || viewDefNamespace || ""
		return `${prefix}/routes/path/${namespace}/${context.merge(
			request.path
		)}`
	}
	if (isCollectionRouteRequest(request)) {
		const [namespace, name] = parseKey(request.collection)
		const viewtype = request.viewtype || "list"
		return (
			`${prefix}/routes/collection/${namespace}/${name}/${viewtype}` +
			(request.recordid ? `/${context.merge(request.recordid)}` : "")
		)
	}
	throw new Error("Not a valid Route Request")
}

const respondJSON = async (response: Response) => {
	if (response.status !== 200) {
		const errorText = await response.text()
		throw new Error(
			errorText
				? errorText
				: "We are sorry, something went wrong on our side"
		)
	}

	return response.json()
}

const respondVoid = async (response: Response) => {
	if (response.status !== 200) {
		const errorText = await response.text()
		throw new Error(errorText)
	}

	return
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
	getRoute: async (
		context: Context,
		request: NavigateRequest
	): Promise<RouteState> => {
		const routeUrl = getRouteUrl(context, request)
		const response = await fetch(routeUrl)
		return respondJSON(response)
	},
	loadData: async (
		context: Context,
		requestBody: LoadRequestBatch
	): Promise<LoadResponseBatch> => {
		const prefix = getPrefix(context)
		const response = await postJSON(`${prefix}/wires/load`, requestBody)
		return respondJSON(response)
	},
	saveData: async (
		context: Context,
		requestBody: SaveRequestBatch
	): Promise<SaveResponseBatch> => {
		const prefix = getPrefix(context)
		const response = await postJSON(`${prefix}/wires/save`, requestBody)
		return respondJSON(response)
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
		return respondJSON(response)
	},
	callGeneratorBot: async (
		context: Context,
		namespace: string,
		name: string,
		params: BotParams
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const response = await postJSON(
			`${prefix}/metadata/generate/${namespace}/${name}`,
			params
		)
		return respondJSON(response)
	},
	getBotParams: async (
		context: Context,
		namespace: string,
		name: string,
		type: string
	): Promise<ParamDefinition[]> => {
		const prefix = getPrefix(context)
		const response = await fetch(
			`${prefix}/bots/params/${type}/${namespace}/${name}`
		)
		return respondJSON(response)
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
	): Promise<PlainWireRecord> => {
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

		return respondJSON(response)
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
		return respondJSON(response)
	},
	getComponentPackURL: (
		context: Context,
		namespace: string,
		name: string,
		buildMode?: boolean
	) => {
		const prefix = getPrefix(context)
		const buildModeSuffix = buildMode ? "builder.js" : "runtime.js"
		return `${prefix}/componentpacks/${namespace}/${name}/${buildModeSuffix}`
	},
	getMetadataList: async (
		context: Context,
		metadataType: MetadataType,
		namespace: string,
		grouping?: string
	): Promise<Record<string, MetadataInfo>> => {
		const prefix = getPrefix(context)
		const mdType = METADATA[metadataType]
		const groupingUrl = grouping ? `/${grouping}` : ""
		const namespaceUrl = namespace ? `/namespace/${namespace}` : ""
		const response = await fetch(
			`${prefix}/metadata/types/${mdType}${namespaceUrl}/list${groupingUrl}`
		)
		return respondJSON(response)
	},
	getCollectionMetadata: async (
		context: Context,
		collectionName: string
	): Promise<LoadResponseBatch> => {
		const prefix = getPrefix(context)
		const response = await fetch(
			`${prefix}/collections/meta/${collectionName}`
		)
		return respondJSON(response)
	},
	getAvailableNamespaces: async (
		context: Context,
		metadataType?: MetadataType
	): Promise<string[]> => {
		const prefix = getPrefix(context)
		const mdType = metadataType && METADATA[metadataType]
		const mdTypeUrl = mdType ? `/${mdType}` : ""
		const response = await fetch(
			`${prefix}/metadata/namespaces${mdTypeUrl}`
		)
		return respondJSON(response)
	},
	getConfigValues: async (
		context: Context
	): Promise<ConfigValueResponse[]> => {
		const prefix = getPrefix(context)
		const response = await fetch(`${prefix}/configvalues`)
		return respondJSON(response)
	},
	setConfigValue: async (
		context: Context,
		key: string,
		value: string
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const [namespace, name] = parseKey(key)
		const response = await postJSON(
			`${prefix}/configvalues/${namespace}/${name}`,
			{
				value,
			}
		)
		return respondJSON(response)
	},
	getSecrets: async (context: Context): Promise<SecretResponse[]> => {
		const prefix = getPrefix(context)
		const response = await fetch(`${prefix}/secrets`)
		return respondJSON(response)
	},
	setSecret: async (
		context: Context,
		key: string,
		value: string
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const [namespace, name] = parseKey(key)
		const response = await postJSON(
			`${prefix}/secrets/${namespace}/${name}`,
			{
				value,
			}
		)
		return respondJSON(response)
	},
	getFeatureFlags: async (
		context: Context,
		user?: string
	): Promise<FeatureFlagResponse[]> => {
		const prefix = getPrefix(context)
		const userUrl = user ? `/${user}` : ""
		const response = await fetch(`${prefix}/featureflags${userUrl}`)
		return respondJSON(response)
	},
	setFeatureFlag: async (
		context: Context,
		key: string,
		value: boolean,
		user?: string
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const [namespace, name] = parseKey(key)
		const response = await postJSON(
			`${prefix}/featureflags/${namespace}/${name}`,
			{
				value,
				user,
			}
		)
		return respondJSON(response)
	},
	signup: async (
		signupMethod: string,
		requestBody: Record<string, string>
	): Promise<LoginResponse> => {
		const [namespace, name] = parseKey(signupMethod)
		const response = await postJSON(
			`/site/auth/${namespace}/${name}/signup`,
			requestBody
		)
		return respondJSON(response)
	},
	signUpConfirm: async (
		signupMethod: string,
		requestBody: Record<string, string>
	): Promise<void> => {
		const [namespace, name] = parseKey(signupMethod)
		const response = await postJSON(
			`/site/auth/${namespace}/${name}/signup/confirm`,
			requestBody
		)

		return respondVoid(response)
	},
	checkAvailability: async (
		signupMethod: string,
		username: string
	): Promise<void> => {
		const [namespace, name] = parseKey(signupMethod)
		const response = await postJSON(
			`/site/auth/${namespace}/${name}/checkavailability/${username}`
		)
		return respondVoid(response)
	},
	login: async (
		authSource: string,
		requestBody: Record<string, string>
	): Promise<LoginResponse> => {
		const [namespace, name] = parseKey(authSource)
		const response = await postJSON(
			`/site/auth/${namespace}/${name}/login`,
			requestBody
		)

		return respondJSON(response)
	},
	logout: async (): Promise<LoginResponse> => {
		const response = await postJSON("/site/auth/logout")
		return respondJSON(response)
	},
	forgotPassword: async (
		authSource: string,
		requestBody: Record<string, string>
	): Promise<void> => {
		const [namespace, name] = parseKey(authSource)
		const response = await postJSON(
			`/site/auth/${namespace}/${name}/forgotpassword`,
			requestBody
		)

		return respondVoid(response)
	},
	forgotPasswordConfirm: async (
		authSource: string,
		requestBody: Record<string, string>
	): Promise<void> => {
		const [namespace, name] = parseKey(authSource)
		const response = await postJSON(
			`/site/auth/${namespace}/${name}/forgotpassword/confirm`,
			requestBody
		)

		return respondVoid(response)
	},
	createJob: async (context: Context, spec: Spec): Promise<JobResponse> => {
		const prefix = getPrefix(context)
		const url = `${prefix}/bulk/job`
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(spec),
		})
		return respondJSON(response)
	},
	importData: async (
		context: Context,
		fileData: File,
		jobId: string
	): Promise<void> => {
		const prefix = getPrefix(context)
		const url = `${prefix}/bulk/job/${jobId}/batch`

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
			},
			body: fileData,
		})

		return respondVoid(response)
	},
	getBuilderDeps: async (context: Context): Promise<Dependencies> => {
		const prefix = getPrefix(context)
		const viewId = context.getViewDefId()
		if (!viewId) throw new Error("No View Context Provided")
		const [namespace, name] = parseKey(viewId)
		const response = await fetch(
			`${prefix}/metadata/builder/${namespace}/${name}`
		)
		return respondJSON(response)
	},
	createLogin: async (
		context: Context,
		signupMethod: string,
		requestBody: Record<string, string>
	): Promise<void> => {
		const prefix = getPrefix(context)
		const [namespace, name] = parseKey(signupMethod)
		const response = await postJSON(
			`${prefix}/auth/${namespace}/${name}/createlogin`,
			requestBody
		)
		return respondVoid(response)
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
	PathNavigateRequest,
	CollectionNavigateRequest,
	NavigateRequest,
	JobResponse,
	MetadataInfo,
	LoginResponse,
}
