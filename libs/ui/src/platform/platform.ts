import { LoadRequestBatch } from "../load/loadrequest"
import {
	CollectionMetadataResponseBatch,
	LoadResponseBatch,
} from "../load/loadresponse"
import { SaveRequestBatch } from "../load/saverequest"
import { SaveResponseBatch } from "../load/saveresponse"
import { Context } from "../context/context"
import { Dependencies, RouteState, RouteTag } from "../bands/route/types"
import { Spec } from "../definition/definition"
import { parseKey } from "../component/path"
import { PlainFieldValue, PlainWireRecord } from "../bands/wirerecord/types"
import { ParamDefinition } from "../definition/param"
import { UserState } from "../bands/user/types"
import {
	getJSON,
	postBinary,
	post,
	postJSON,
	respondJSON,
	respondVoid,
	postMultipartForm,
	del,
	interceptPlatformRedirects,
} from "./async"
import { memoizedGetJSON } from "./memoizedAsync"
import { SiteState } from "../bands/site"
import { UploadRequest } from "../load/uploadrequest"
import { PlainCollectionMap } from "../bands/collection/types"
import { ServerWire } from "../bands/wire/types"
import { transformServerWire } from "../bands/wire/transform"
import {
	Bundleable,
	BundleableBase,
	METADATA,
	MetadataKey,
	MetadataType,
} from "../metadata/types"
import { OAuth2AuthorizationMetadataResponse } from "../bands/oauth2/signals"

type ServerWireLoadResponse = {
	wires: ServerWire[]
	collections: PlainCollectionMap
}

interface HasParams {
	params?: Record<string, string>
}

const injectParams = (
	x: HasParams[],
	paramsToInject?: Record<string, string>
) => {
	if (!x || !x.length || !paramsToInject) return
	x.forEach((y) => (y.params = paramsToInject))
}

// Allows us to load static vendor assets, such as Monaco modules, from custom paths
// and for us to load Uesio-app-versioned files from the server
interface UesioWindow extends Window {
	uesioStaticAssetsPath: string
	uesioStaticAssetsHost: string
	// This is a hack to ensure we always load the correct version of Monaco
	monacoEditorVersion: string
}

let staticAssetsPath: string | undefined

export const getStaticAssetsPath = () => {
	if (staticAssetsPath) return staticAssetsPath
	return (window as unknown as UesioWindow).uesioStaticAssetsPath
}

export const setStaticAssetsPath = (path: string | undefined) => {
	staticAssetsPath = path
}

const getStaticAssetsHost = () =>
	(window as unknown as UesioWindow).uesioStaticAssetsHost

const getMonacoEditorVersion = () =>
	(window as unknown as UesioWindow).monacoEditorVersion

type BotParams = {
	[key: string]: PlainFieldValue
}

type BotResponse = {
	params: BotParams
	success: boolean
	error: string
}

type IntegrationActionMetadata = {
	inputs?: ParamDefinition[]
}

type ConfigValueResponse = {
	value: string
	managedby: string
} & BundleableBase

type SecretResponse = {
	managedby: string
	value: string
} & BundleableBase

interface BaseFeatureFlag extends Bundleable {
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
	label?: string
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

const systemBundles = [
	"uesio/io",
	"uesio/builder",
	"uesio/studio",
	"uesio/core",
]

export const isSystemBundle = (namespace: string) =>
	systemBundles.includes(namespace)

// Returns a version number to use for requesting a site static asset, such as a File or a Component Pack file, such as:
// - "/v1.2.3" (for regularly-versioned site assets)
// - "/abcd1234" (for system bundle resources in Prod environments)
// - "/1234567890" (for system bundle resources in local development)
// THIS LOGIC SHOULD CORRESPOND ROUGHLY TO THE SERVER-SIDE LOGIC (pkg/controller/mergedata.go#getPackUrl)
export const getSiteBundleAssetVersion = (
	site: SiteState | undefined,
	namespace: string,
	assetModstamp?: string
) => {
	const staticAssetsPath = getStaticAssetsPath()

	let siteBundleVersion = ""

	// Handle requests for system bundles specially,
	// since we don't update their bundle dependencies at all and just use dummy "v0.0.1" everywhere
	if (isSystemBundle(namespace)) {
		if (staticAssetsPath) {
			// We DO update the static assets version for the whole Docker image, so use that if we have it
			siteBundleVersion = staticAssetsPath // assets path SHOULD have a leading / already
		} else if (assetModstamp) {
			// If we don't have a Git sha, then we are in local development,
			// in which case we want to use the asset modstamp to avoid stale file loads
			siteBundleVersion = `/${assetModstamp}`
		}
	} else {
		// NON-system bundles
		if (namespace === site?.app) {
			// If requested namespace is the app's name, use the site version
			siteBundleVersion = `/${site.version}`
		} else if (site?.dependencies) {
			// For all other deps, use the site's declared bundle dependency version,
			// which SHOULD be present (otherwise how are they using it...)
			const match = site.dependencies[namespace]
			if (match?.version) {
				siteBundleVersion = `/${match.version}`
			}
		}
	}

	// If we still don't have a bundle version, for some bizarre reason...
	if (!siteBundleVersion) {
		if (assetModstamp) {
			// Prefer modstamp
			siteBundleVersion = `/${assetModstamp}`
		} else if (site?.version) {
			// Final fallback --- use site version
			siteBundleVersion = `/${site?.version}`
		}
	}

	return siteBundleVersion
}

const pageLoadTime = new Date().getTime()

const getDefaultModstamp = (namespace: string) => {
	if (isSystemBundle(namespace)) {
		// By default, use the static assets path, if there is one,
		// which should be equivalent to the app start time or the Docker image hash.
		// If not, use page load time.
		const staticAssetsPath = getStaticAssetsPath()
		if (staticAssetsPath) {
			// Trim off the leading "/"
			return staticAssetsPath.substring(1)
		} else {
			return `${pageLoadTime}`
		}
	} else {
		return `${new Date().getTime()}`
	}
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
		injectParams(requestBody.wires, context.getParams())
		let response
		try {
			response = await postJSON(
				context,
				`${prefix}/wires/load`,
				requestBody
			)
		} catch (err) {
			return Promise.reject(err)
		}
		const loadResponse = (await respondJSON(
			response
		)) as ServerWireLoadResponse

		const { collections, wires } = loadResponse

		return {
			collections,
			wires: wires.map(transformServerWire),
		}
	},
	saveData: async (
		context: Context,
		requestBody: SaveRequestBatch
	): Promise<SaveResponseBatch> => {
		const prefix = getPrefix(context)
		injectParams(requestBody.wires, context.getParams())
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
	getFileURL: (
		context: Context,
		namespace: string,
		name: string,
		modstamp = context.getStaticFileModstamp(`${namespace}.${name}`)
	) => {
		const version = getSiteBundleAssetVersion(
			context.getSite(),
			namespace,
			modstamp ? `${modstamp}` : getDefaultModstamp(namespace)
		)
		const prefix = getPrefix(context)
		return `${prefix}/files/${namespace}${version}/${name}`
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
		request: UploadRequest,
		fileData: File
	): Promise<PlainWireRecord> => {
		const prefix = getPrefix(context)
		const url = `${prefix}/userfiles/upload`
		const formData = new FormData()
		// HTML file input, chosen by user
		formData.append(
			"details",
			JSON.stringify({
				...request,
				name: fileData.name,
			})
		)

		formData.append("file", fileData)
		const response = await postMultipartForm(context, url, formData)
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
		modstamp = getDefaultModstamp(namespace),
		path = "runtime.js"
	) => {
		const workspace = context.getWorkspace()
		if (workspace) {
			// If we are in a workspace context, use component pack modstamps to load in their resources,
			// since we don't have a stable "site" version that we can safely use, as the bundle dependency list is not immutable.
			return `/workspace/${workspace.app}/${workspace.name}/componentpacks/${namespace}/${modstamp}/${name}/${path}`
		}
		const version = getSiteBundleAssetVersion(
			context.getSite(),
			namespace,
			modstamp
		)
		return `/site/componentpacks/${namespace}${version}/${name}/${path}`
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
		return memoizedGetJSON(
			context,
			`${prefix}/metadata/types/${mdType}${namespaceUrl}/list${groupingUrl}`
		)
	},
	getCollectionMetadata: async (
		context: Context,
		collectionName: string
	): Promise<CollectionMetadataResponseBatch> =>
		memoizedGetJSON<CollectionMetadataResponseBatch>(
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
	deleteAuthCredentials: async (
		context: Context,
		integrationName: MetadataKey
	): Promise<Response> =>
		del(
			context,
			`${getPrefix(context)}/auth/credentials/${integrationName}`
		),
	getOAuth2RedirectMetadata: async (
		context: Context,
		integrationName: MetadataKey
	): Promise<OAuth2AuthorizationMetadataResponse> =>
		getJSON(
			context,
			`${getPrefix(context)}/oauth2/authorize/${integrationName}`
		),
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
			context.mergeString("$StaticFile{" + path + "}")
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
	runIntegrationAction: async (
		context: Context,
		integration: MetadataKey,
		action: string,
		params: BotParams
	): Promise<Response> => {
		const prefix = getPrefix(context)
		const response = await postJSON(
			context,
			`${prefix}/integrationactions/run/${integration.replace(
				".",
				"/"
			)}?action=${encodeURIComponent(action)}`,
			params
		)
		if (interceptPlatformRedirects(response)) {
			return response
		}
		if (response.status >= 400) {
			const errorText = await response.text()
			throw new Error(
				errorText
					? errorText
					: "We are sorry, something went wrong on our side"
			)
		}
		return response
	},
	describeIntegrationAction: async (
		context: Context,
		integrationType: MetadataKey,
		actionName: string
	): Promise<IntegrationActionMetadata> => {
		if (!integrationType || !actionName) return Promise.resolve({})
		const prefix = getPrefix(context)
		return getJSON(
			context,
			`${prefix}/integrationactions/describe/${integrationType.replace(
				".",
				"/"
			)}?action=${encodeURIComponent(actionName)}`
		)
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
