import { LoadRequestBatch } from "../load/loadrequest"
import { LoadResponseBatch } from "../load/loadresponse"
import { LoginRequest, LoginResponse } from "../auth/auth"
import { SaveRequestBatch } from "../load/saverequest"
import { SaveResponseBatch } from "../load/saveresponse"
import { Context } from "../context/context"
import { metadata } from "@uesio/constants"
import { WorkspaceState } from "../bands/route/types"
import { MetadataListStore } from "../bands/builder/types"
import { Theme } from "../bands/theme/types"

type RouteResponse = {
	view: string
	params: {
		[key: string]: string
	}
	path: string
	workspace?: WorkspaceState
}

type BotParams = {
	[key: string]: string
}

type BotResponse = {
	success: boolean
}

interface Platform {
	getView(context: Context, namespace: string, name: string): Promise<string>
	getTheme(context: Context, namespace: string, name: string): Promise<Theme>
	getRoute(
		context: Context,
		namespace: string,
		route: string
	): Promise<RouteResponse>
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
	getBuilderCoreURL(): string
	getMetadataList(
		context: Context,
		metadataType: metadata.MetadataType,
		namespace: string,
		grouping?: string
	): Promise<MetadataListStore>
	getAvailableNamespaces(context: Context): Promise<MetadataListStore>
	login(request: LoginRequest): Promise<LoginResponse>
	logout(): Promise<LoginResponse>
}

export { Platform, RouteResponse, BotResponse, BotParams }
