import { LoadRequestBatch } from "../load/loadrequest"
import { LoadResponseBatch } from "../load/loadresponse"
import { LoginRequest, LoginResponse } from "../auth/auth"
import { SaveRequestBatch } from "../load/saverequest"
import { SaveResponseBatch } from "../load/saveresponse"
import { Context } from "../context/context"
import { metadata } from "@uesio/constants"
import { MetadataListStore } from "../bands/builder/types"
import { RouteState } from "../bands/route/types"

type BotParams = {
	[key: string]: string
}

type BotResponse = {
	success: boolean
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
		name: string,
		fileCollection: string,
		collectionID: string,
		recordID: string,
		fieldID: string
	): Promise<string>
	getComponentPackURL(
		context: Context,
		namespace: string,
		name: string,
		buildMode: boolean
	): string
	getMetadataList(
		context: Context,
		metadataType: metadata.MetadataType,
		namespace: string,
		grouping?: string
	): Promise<MetadataListStore>
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
	login(request: LoginRequest): Promise<LoginResponse>
	logout(): Promise<LoginResponse>
}

export { Platform, BotResponse, BotParams, ConfigValueResponse, SecretResponse }
