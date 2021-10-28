import { LoadRequestBatch } from "../load/loadrequest"
import { LoadResponseBatch } from "../load/loadresponse"
import { LoginRequest, LoginResponse } from "../auth/auth"
import { SaveRequestBatch } from "../load/saverequest"
import { SaveResponseBatch } from "../load/saveresponse"
import { Context } from "../context/context"
import { MetadataListStore, MetadataType } from "../bands/builder/types"
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
	scope: string
	user: string
}

type JobResponse = {
	id: string
}

interface Platform {
	getView(context: Context, namespace: string, name: string): Promise<string>
	getTheme(context: Context, namespace: string, name: string): Promise<string>
	getRoute(
		context: Context,
		namespace: string,
		route: string
	): Promise<RouteState>
	loadData(
		context: Context,
		batch: LoadRequestBatch
	): Promise<LoadResponseBatch>
	saveData(
		context: Context,
		batch: SaveRequestBatch
	): Promise<SaveResponseBatch>
	callBot(
		context: Context,
		namespace: string,
		name: string,
		params?: BotParams
	): Promise<BotResponse>
	getFileURL(context: Context, namespace: string, name: string): string
	getUserFileURL(context: Context, userfileid: string): string
	uploadFile(
		context: Context,
		fileData: File,
		collectionID: string,
		recordID: string,
		fieldID: string
	): Promise<string>
	deleteFile(context: Context, userfileid: string): Promise<BotResponse>
	getComponentPackURL(
		context: Context,
		namespace: string,
		name: string,
		buildMode: boolean
	): string
	getMetadataList(
		context: Context,
		metadataType: MetadataType,
		namespace: string,
		grouping?: string
	): Promise<MetadataListStore>
	getCollectionMetadata(
		context: Context,
		collectionName: string
	): Promise<LoadResponseBatch>
	getAvailableNamespaces(context: Context): Promise<MetadataListStore>
	getConfigValues(context: Context): Promise<ConfigValueResponse[]>
	setConfigValue(
		context: Context,
		key: string,
		value: string
	): Promise<BotResponse>
	getSecrets(context: Context): Promise<SecretResponse[]>
	setSecret(
		context: Context,
		key: string,
		value: string
	): Promise<BotResponse>
	getFeatureFlags(context: Context): Promise<FeatureFlagResponse[]>
	setFeatureFlag(
		context: Context,
		key: string,
		value: boolean
	): Promise<BotResponse>
	login(request: LoginRequest): Promise<LoginResponse>
	logout(): Promise<LoginResponse>
	createImportJob(context: Context, spec: ImportSpec): Promise<JobResponse>
	importData(
		context: Context,
		fileData: File,
		jobId: string
	): Promise<Response>
}

export {
	Platform,
	BotResponse,
	BotParams,
	ConfigValueResponse,
	SecretResponse,
	FeatureFlagResponse,
}
