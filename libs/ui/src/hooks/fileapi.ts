import { Uesio } from "./hooks"
import { Dispatcher, getPlatform } from "../store/store"
import { StoreAction } from "../store/actions/actions"
import { Context } from "../context/context"

const getURL = (context: Context, namespace: string, name: string) =>
	getPlatform().getFileURL(context, namespace, name)

const getURLFromFullName = (context: Context, fullName: string) => {
	const [namespace, name] = fullName.split(".")
	return getURL(context, namespace, name)
}

const getUserFileURL = (
	context: Context,
	userfileid: string,
	cacheBuster?: boolean
) => {
	if (!userfileid) return ""
	const platform = getPlatform()
	const url = platform.getUserFileURL(context, userfileid)
	return cacheBuster ? url + "&cb=" + Date.now() : url
}

const deleteUserFile = (context: Context, userfileid: string) =>
	getPlatform().deleteUserFile(context, userfileid)

const uploadFile = (
	context: Context,
	fileData: File,
	name: string,
	fileCollection: string,
	collectionID: string,
	recordID: string,
	fieldID: string
) =>
	getPlatform().uploadFile(
		context,
		fileData,
		name,
		fileCollection,
		collectionID,
		recordID,
		fieldID
	)

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
