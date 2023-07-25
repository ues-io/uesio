import { LoadRequestBatch } from "../load/loadrequest"
import { LoadResponseBatch } from "../load/loadresponse"
import { SaveRequestBatch } from "../load/saverequest"
import { SaveResponseBatch } from "../load/saveresponse"
import { Context } from "../context/context"
import { MetadataType, METADATA } from "../bands/builder/types"
import { Dependencies, RouteState, RouteTag } from "../bands/route/types"
import { Spec } from "../definition/definition"
import { parseKey } from "../component/path"
import { PlainWireRecord } from "../bands/wirerecord/types"
import { ParamDefinition } from "../definition/param"
import { UserState } from "../bands/user/types"
import {
	getJSON,
	postBinary,
	post,
	postJSON,
	respondJSON,
	respondVoid,
} from "./async"
import { memoizedGetJSON } from "./memoizedAsync"

// Allows us to load static vendor assets, such as Monaco modules, from custom paths
// and for us to load Uesio-app-versioned files from the server
interface UesioWindow extends Window {
	uesioStaticAssetsPath: string
	uesioStaticAssetsHost: string
	// This is a hack to ensure we always load the correct version of Monaco
	monacoEditorVersion: string
}

const getStaticAssetsPath = () =>
	(window as unknown as UesioWindow).uesioStaticAssetsPath

const getStaticAssetsHost = () =>
	(window as unknown as UesioWindow).uesioStaticAssetsHost

const getMonacoEditorVersion = () =>
	(window as unknown as UesioWindow).monacoEditorVersion

type BotParams = {
	[key: string]: string
}

type BotResponse = {
	params: BotParams
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

interface BaseFeatureFlag {
	name: string
	namespace: string
	user: string
	validForOrgs?: boolean
}

interface NumberFeatureFlag extends BaseFeatureFlag {
	type: "NUMBER"
	value: number
	defaultValue?: number
	min?: number
	max?: number
}

interface CheckboxFeatureFlag extends BaseFeatureFlag {
	type: "CHECKBOX"
	value: boolean
	defaultValue?: boolean
}

type FeatureFlagResponse = NumberFeatureFlag | CheckboxFeatureFlag

type JobResponse = {
	id: string
}

type PathNavigateRequest = {
	namespace: string
	path: string
	title?: string
	tags?: RouteTag[]
}

type AssignmentNavigateRequest = {
	collection: string
	viewtype?: string
	recordid?: string
}

type MetadataInfo = {
	color: string
	icon: string
	namespace: string
	key: string
}

type NamespaceInfo = {
	color: string
	icon: string
	namespace: string
}

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

export const getPrefix = (context: Context) => {
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

const getSiteBundleVersion = (context: Context) => {
	const site = context.getSite()
	const staticAssetsPath = getStaticAssetsPath()
	if (site && site.version) {
		// Special case --- if this is a Uesio-provided site, we don't (currently) ever update the bundle versions,
		// but we DO update the static assets path for the whole Docker image, so use that. It will look like "/abcdefg"
		if (site.app.startsWith("uesio/") && staticAssetsPath) {
			return staticAssetsPath
		}
		return `/${site.version}`
	}
	return ""
}

const platform = {
	getRoute: async (
		context: Context,
		request: PathNavigateRequest
	): Promise<RouteState> => {
		const prefix = getPrefix(context)

		// This is the namespace of the viewdef in context. We can assume if a namespace isn't
		// provided, they want to navigate within the same namespace.
		const viewDefId = context.getViewDefId() || ""
		const [viewDefNamespace] = parseKey(viewDefId)
		const namespace = request.namespace || viewDefNamespace || ""

		return getJSON(
			context,
			`${prefix}/routes/path/${namespace}/${context.mergeString(
				request.path
			)}`
		)
	},
	getRouteAssignment: async (
		context: Context,
		request: AssignmentNavigateRequest
	): Promise<RouteState> => {
		const prefix = getPrefix(context)
		const [namespace, name] = parseKey(request.collection)
		const viewtype = request.viewtype || "list"

		return getJSON(
			context,
			`${prefix}/routes/collection/${namespace}/${name}/${viewtype}` +
				(request.recordid
					? `/${context.mergeString(request.recordid)}`
					: "")
		)
	},
	loadData: async (
		context: Context,
		requestBody: LoadRequestBatch
	): Promise<LoadResponseBatch> => {
		const prefix = getPrefix(context)
		const response = await postJSON(
			context,
			`${prefix}/wires/load`,
			requestBody
		)
		return respondJSON(response)
	},
	saveData: async (
		context: Context,
		requestBody: SaveRequestBatch
	): Promise<SaveResponseBatch> => {
		const prefix = getPrefix(context)
		const response = await postJSON(
			context,
			`${prefix}/wires/save`,
			requestBody
		)
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
			context,
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
			context,
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
	): Promise<ParamDefinition[]> =>
		getJSON(
			context,
			`${getPrefix(context)}/bots/params/${type}/${namespace}/${name}`
		),
	getViewParams: async (
		context: Context,
		namespace: string,
		name: string
	): Promise<ParamDefinition[]> =>
		getJSON(
			context,
			`${getPrefix(context)}/views/params/${namespace}/${name}`
		),
	getFileURL: (context: Context, namespace: string, name: string) => {
		const siteBundleVersion = getSiteBundleVersion(context)
		const prefix = getPrefix(context)
		return `${prefix}/files/${namespace}${siteBundleVersion}/${name}`
	},
	getUserFileURL: (
		context: Context,
		userfileid: string,
		fileVersion?: string
	) => {
		const prefix = getPrefix(context)
		const fileVersionParam = fileVersion
			? `&version=${encodeURIComponent(fileVersion)}`
			: ""
		return `${prefix}/userfiles/download?userfileid=${encodeURIComponent(
			userfileid
		)}${fileVersionParam}`
	},
	uploadFile: async (
		context: Context,
		fileData: File,
		collectionID: string,
		recordID: string,
		fieldID?: string
	): Promise<PlainWireRecord> => {
		const prefix = getPrefix(context)
		const url = `${prefix}/userfiles/upload`
		const params = new URLSearchParams()
		params.append("name", fileData.name)
		params.append("collectionid", collectionID)
		params.append("recordid", recordID)
		if (fieldID) params.append("fieldid", fieldID)

		const response = await postBinary(
			context,
			url + "?" + params.toString(),
			fileData
		)
		return respondJSON(response)
	},
	deleteFile: async (
		context: Context,
		userFileID: string
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const url = `${prefix}/userfiles/delete/${userFileID}`
		const response = await post(context, url)
		return respondJSON(response)
	},
	getComponentPackURL: (
		context: Context,
		namespace: string,
		name: string,
		path = "runtime.js"
	) => {
		const siteBundleVersion = getSiteBundleVersion(context)
		const prefix = getPrefix(context)
		return `${prefix}/componentpacks/${namespace}${siteBundleVersion}/${name}/${path}`
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
		return getJSON(
			context,
			`${prefix}/metadata/types/${mdType}${namespaceUrl}/list${groupingUrl}`
		)
	},
	getCollectionMetadata: async (
		context: Context,
		collectionName: string
	): Promise<LoadResponseBatch> =>
		memoizedGetJSON<LoadResponseBatch>(
			context,
			`${getPrefix(context)}/collections/meta/${collectionName}`
		),
	getAvailableNamespaces: async (
		context: Context,
		metadataType?: MetadataType
	): Promise<string[]> => {
		const prefix = getPrefix(context)
		const mdType = metadataType && METADATA[metadataType]
		const mdTypeUrl = mdType ? `/${mdType}` : ""
		return getJSON(context, `${prefix}/metadata/namespaces${mdTypeUrl}`)
	},
	getConfigValues: async (context: Context): Promise<ConfigValueResponse[]> =>
		getJSON(context, `${getPrefix(context)}/configvalues`),
	setConfigValue: async (
		context: Context,
		key: string,
		value: string
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const [namespace, name] = parseKey(key)
		const response = await postJSON(
			context,
			`${prefix}/configvalues/${namespace}/${name}`,
			{
				value,
			}
		)
		return respondJSON(response)
	},
	getSecrets: async (context: Context): Promise<SecretResponse[]> =>
		getJSON(context, `${getPrefix(context)}/secrets`),
	setSecret: async (
		context: Context,
		key: string,
		value: string
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const [namespace, name] = parseKey(key)
		const response = await postJSON(
			context,
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
	): Promise<FeatureFlagResponse[]> =>
		getJSON(
			context,
			`${getPrefix(context)}/featureflags${user ? `/${user}` : ""}`
		),
	setFeatureFlag: async (
		context: Context,
		key: string,
		value: boolean | number,
		user?: string
	): Promise<BotResponse> => {
		const prefix = getPrefix(context)
		const [namespace, name] = parseKey(key)
		const response = await postJSON(
			context,
			`${prefix}/featureflags/${namespace}/${name}`,
			{
				value,
				user,
			}
		)
		return respondJSON(response)
	},
	signup: async (
		context: Context,
		signupMethod: string,
		requestBody: Record<string, string>
	): Promise<LoginResponse> => {
		const [namespace, name] = parseKey(signupMethod)
		const response = await postJSON(
			context,
			`/site/auth/${namespace}/${name}/signup`,
			requestBody
		)
		return respondJSON(response)
	},
	signUpConfirm: async (
		context: Context,
		signupMethod: string,
		requestBody: Record<string, string>
	): Promise<void> => {
		const [namespace, name] = parseKey(signupMethod)
		const response = await postJSON(
			context,
			`/site/auth/${namespace}/${name}/signup/confirm`,
			requestBody
		)
		return respondVoid(response)
	},
	checkAvailability: async (
		context: Context,
		signupMethod: string,
		username: string
	): Promise<void> => {
		const [namespace, name] = parseKey(signupMethod)
		const response = await post(
			context,
			`/site/auth/${namespace}/${name}/checkavailability/${username}`
		)
		return respondVoid(response)
	},
	login: async (
		context: Context,
		authSource: string,
		requestBody: Record<string, string>
	): Promise<LoginResponse> => {
		const [namespace, name] = parseKey(authSource)
		const response = await postJSON(
			context,
			`/site/auth/${namespace}/${name}/login`,
			requestBody
		)
		return respondJSON(response)
	},
	logout: async (context: Context): Promise<LoginResponse> => {
		const response = await post(context, "/site/auth/logout")
		return respondJSON(response)
	},
	forgotPassword: async (
		context: Context,
		authSource: string,
		requestBody: Record<string, string>
	): Promise<void> => {
		const prefix = getPrefix(context)
		const [namespace, name] = parseKey(authSource)
		const response = await postJSON(
			context,
			`${prefix}/auth/${namespace}/${name}/forgotpassword`,
			requestBody
		)
		return respondVoid(response)
	},
	forgotPasswordConfirm: async (
		context: Context,
		authSource: string,
		requestBody: Record<string, string>
	): Promise<void> => {
		const [namespace, name] = parseKey(authSource)
		const response = await postJSON(
			context,
			`/site/auth/${namespace}/${name}/forgotpassword/confirm`,
			requestBody
		)
		return respondVoid(response)
	},
	createJob: async (context: Context, spec: Spec): Promise<JobResponse> => {
		const response = await postJSON(
			context,
			`${getPrefix(context)}/bulk/job`,
			spec
		)
		return respondJSON(response)
	},
	importData: async (
		context: Context,
		fileData: File,
		jobId: string
	): Promise<void> => {
		const prefix = getPrefix(context)
		const url = `${prefix}/bulk/job/${jobId}/batch`
		const response = await postBinary(context, url, fileData)
		return respondVoid(response)
	},
	getBuilderDeps: async (context: Context): Promise<Dependencies> => {
		const prefix = getPrefix(context)
		const viewId = context.getViewDefId()
		if (!viewId) throw new Error("No View Context Provided")
		const [namespace, name] = parseKey(viewId)
		return getJSON(
			context,
			`${prefix}/metadata/builder/${namespace}/${name}`
		)
	},
	getStaticAssetAsJSON: async <T>(
		context: Context,
		path: string
	): Promise<T> =>
		memoizedGetJSON<T>(
			context,
			`${getStaticAssetsHost()}${getStaticAssetsPath()}${path}`
		),
	createLogin: async (
		context: Context,
		signupMethod: string,
		requestBody: Record<string, string>
	): Promise<void> => {
		const prefix = getPrefix(context)
		const [namespace, name] = parseKey(signupMethod)
		const response = await postJSON(
			context,
			`${prefix}/auth/${namespace}/${name}/createlogin`,
			requestBody
		)
		return respondVoid(response)
	},
	autocomplete: async (
		context: Context,
		request: AutocompleteRequest
	): Promise<AutocompleteResponse> => {
		const prefix = getPrefix(context)
		const response = await postJSON(
			context,
			`${prefix}/ai/complete`,
			request
		)
		return respondJSON(response)
	},
	getMonacoEditorVersion,
	getStaticAssetsHost,
	getStaticAssetsPath,
	memoizedGetJSON,
}

type AutocompleteRequest = {
	input: string
	format: string
	model: string
	maxResults?: number
	useCache?: boolean
}

type AutocompleteResponse = {
	choices?: string[]
	error?: string
}

type Platform = typeof platform

export { platform }

export type {
	Platform,
	AutocompleteRequest,
	AutocompleteResponse,
	BotResponse,
	BotParams,
	ConfigValueResponse,
	SecretResponse,
	CheckboxFeatureFlag,
	NumberFeatureFlag,
	FeatureFlagResponse,
	PathNavigateRequest,
	AssignmentNavigateRequest,
	JobResponse,
	MetadataInfo,
	NamespaceInfo,
	LoginResponse,
}
