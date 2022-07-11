import { Uesio } from "./hooks"
import { getPlatform } from "../store/store"
import { Context } from "../context/context"
import WireRecord from "../bands/wirerecord/class"
import { useEffect, useState } from "react"
import { PlainWireRecord } from "../wireexports"
import { ID_FIELD } from "../collectionexports"

const getURL = (context: Context, namespace: string, name: string) =>
	getPlatform().getFileURL(context, namespace, name)

const getURLFromFullName = (context: Context, fullName: string) => {
	const [namespace, name] = fullName.split(".")
	return getURL(context, namespace, name)
}

const getUserFileURL = (
	context: Context,
	userfileid: string,
	cacheBuster?: string
) => {
	if (!userfileid) return ""
	const platform = getPlatform()
	const url = platform.getUserFileURL(context, userfileid)
	return cacheBuster ? url + "&cb=" + cacheBuster : url
}

const deleteFile = (context: Context, userFileID: string) =>
	getPlatform().deleteFile(context, userFileID)

const uploadFile = (
	context: Context,
	fileData: File,
	collectionID: string,
	recordID: string,
	fieldID: string
) =>
	getPlatform().uploadFile(context, fileData, collectionID, recordID, fieldID)

class FileAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	getURL = getURL
	getURLFromFullName = getURLFromFullName
	getUserFileURL = getUserFileURL
	uploadFile = uploadFile
	deleteFile = deleteFile

	useUserFile = (context: Context, record: WireRecord, fieldId: string) => {
		const [content, setContent] = useState<string>("")
		useEffect(() => {
			const userFile = record.getFieldValue<PlainWireRecord>(fieldId)
			const userFileId = userFile?.[ID_FIELD] as string
			const fileUrl = getUserFileURL(context, userFileId)
			if (!fileUrl) {
				setContent("")
				return
			}
			const fetchData = async () => {
				const res = await fetch(fileUrl)
				const text = await res.text()
				setContent(text)
			}
			fetchData()
		}, [])
		return content
	}

	useFile = (context: Context, fileId?: string) => {
		const [content, setContent] = useState<string>("")
		useEffect(() => {
			if (!fileId) return
			const fileUrl = this.uesio.file.getURLFromFullName(context, fileId)
			if (!fileUrl) {
				setContent("")
				return
			}
			const fetchData = async () => {
				const res = await fetch(fileUrl)
				const text = await res.text()
				setContent(text)
			}
			fetchData()
		}, [])
		return content
	}
}

export {
	FileAPI,
	getURL,
	getURLFromFullName,
	uploadFile,
	deleteFile,
	getUserFileURL,
}
