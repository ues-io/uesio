import { Context } from "../context/context"
import { useEffect, useState } from "react"
import { PlainWireRecord } from "../wireexports"
import { ID_FIELD } from "../collectionexports"
import { platform } from "../platform/platform"

const getURL = platform.getFileURL

const getURLFromFullName = (context: Context, fullName: string) => {
	const [namespace, name] = fullName.split(".")
	return getURL(context, namespace, name)
}

const getUserFileURL = (
	context: Context,
	userfileid: string | undefined,
	cacheBuster?: string
) => {
	if (!userfileid) return ""
	const url = platform.getUserFileURL(context, userfileid)
	return cacheBuster ? url + "&cb=" + cacheBuster : url
}

const deleteFile = platform.deleteFile

const uploadFile = platform.uploadFile

const useUserFile = (
	context: Context,
	userFile: PlainWireRecord | undefined
) => {
	const [content, setContent] = useState<string>("")
	useEffect(() => {
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

const useFile = (context: Context, fileId?: string) => {
	const [content, setContent] = useState<string>("")
	useEffect(() => {
		if (!fileId) return
		const fileUrl = getURLFromFullName(context, fileId)
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

export {
	getURL,
	getURLFromFullName,
	uploadFile,
	deleteFile,
	getUserFileURL,
	useFile,
	useUserFile,
}
