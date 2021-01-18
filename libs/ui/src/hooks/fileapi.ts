import { Uesio } from "./hooks"
import { getPlatform } from "../store/store"
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
	}

	uesio: Uesio

	getURL = getURL
	getURLFromFullName = getURLFromFullName
	getUserFileURL = getUserFileURL
	uploadFile = uploadFile
}

export { FileAPI, getURL, getURLFromFullName, uploadFile, getUserFileURL }
