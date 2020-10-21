import { Uesio } from "./hooks"
import { Dispatcher, getPlatform } from "../store/store"
import { StoreAction } from "../store/actions/actions"
import { Context } from "../context/context"

function getURL(context: Context, namespace: string, name: string): string {
	const platform = getPlatform()
	return platform.getFileURL(context, namespace, name)
}

function getURLFromFullName(
	context: Context,
	fullName: string
): string | undefined {
	const [namespace, name] = fullName.split(".")
	return getURL(context, namespace, name)
}

function getUserFileURL(
	context: Context,
	userfileid: string,
	cacheBuster?: boolean
): string {
	if (!userfileid) {
		return ""
	}
	const platform = getPlatform()
	const url = platform.getUserFileURL(context, userfileid)
	return cacheBuster ? url + "&cb=" + Date.now() : url
}

function deleteUserFile(context: Context, userfileid: string): Promise<string> {
	const platform = getPlatform()
	return platform.deleteUserFile(context, userfileid)
}

function uploadFile(
	context: Context,
	fileData: File,
	name: string,
	fileCollection: string,
	collectionID: string,
	recordID: string,
	fieldID: string
): Promise<string> {
	const platform = getPlatform()
	return platform.uploadFile(
		context,
		fileData,
		name,
		fileCollection,
		collectionID,
		recordID,
		fieldID
	)
}

class FileAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<StoreAction>

	getURL = getURL
	getURLFromFullName = getURLFromFullName
	getUserFileURL = getUserFileURL
	deleteUserFile = deleteUserFile
	uploadFile = uploadFile
}

export {
	FileAPI,
	getURL,
	getURLFromFullName,
	uploadFile,
	getUserFileURL,
	deleteUserFile,
}
