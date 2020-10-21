import { LoadRequestBatch } from "../load/loadrequest"
import { LoadResponseBatch } from "../load/loadresponse"
import { LoginRequest, LoginResponse } from "../auth/auth"
import { SaveRequestBatch } from "../load/saverequest"
import { SaveResponseBatch } from "../load/saveresponse"
import { MetadataListStore } from "../store/types/builderstate"
import { Context } from "../context/context"
import WorkspaceState from "../store/types/workspacestate"

type RouteResponse = {
	viewname: string
	viewnamespace: string
	params: {
		[key: string]: string
	}
	path: string
	workspace?: WorkspaceState
}

type SaveViewRequest = {
	[key: string]: string
}

type SaveViewResponse = {
	success: boolean
}

interface Platform {
	getView(context: Context, namespace: string, name: string): Promise<string>
	saveViews(
		context: Context,
		views: SaveViewRequest
	): Promise<SaveViewResponse>
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
	getFileURL(context: Context, namespace: string, name: string): string
	getUserFileURL(context: Context, userfileid: string): string
	deleteUserFile(context: Context, userfileid: string): Promise<string>
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
		metadataType: string,
		namespace: string,
		grouping?: string
	): Promise<MetadataListStore>
	getAvailableNamespaces(context: Context): Promise<MetadataListStore>
	login(request: LoginRequest): Promise<LoginResponse>
	logout(): Promise<LoginResponse>
}

export { Platform, SaveViewRequest, SaveViewResponse, RouteResponse }
