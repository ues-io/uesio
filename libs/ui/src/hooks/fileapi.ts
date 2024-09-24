import { Context } from "../context/context"
import { useEffect, useState } from "react"
import { PlainWireRecord } from "../wireexports"
import { ID_FIELD, UPDATED_AT_FIELD } from "../collectionexports"
import { platform } from "../platform/platform"
const { deleteFile, uploadFile } = platform

const getURL = platform.getFileURL

const getURLFromFullName = (
	context: Context,
	fullName: string,
	filePath?: string
) => {
	const [namespace, name] = fullName.split(".")
	return getURL(context, namespace, name, undefined, filePath)
}

const getUserFileURL = (
	context: Context,
	userfileid: string | undefined,
	fileVersion?: string
) => {
	if (!userfileid) return ""
	return platform.getUserFileURL(context, userfileid, fileVersion)
}

const useUserFile = (
	context: Context,
	userFile: PlainWireRecord | undefined
): [string, string, (value: string) => void, () => void, () => void] => {
	const [content, setContent] = useState<string>("")
	const [original, setOriginal] = useState<string>("")
	const cancel = () => setContent(original)
	const reset = () => setOriginal(content)
	const userFileId = userFile?.[ID_FIELD] as string
	const updatedAt = userFile?.[UPDATED_AT_FIELD] as string
	const fileUrl = getUserFileURL(context, userFileId, updatedAt)
	useEffect(() => {
		if (!fileUrl) {
			setContent("")
			setOriginal("")
			return
		}
		const fetchData = async () => {
			const res = await fetch(fileUrl)
			const text = await res.text()
			setContent(text)
			setOriginal(text)
		}
		fetchData()
	}, [fileUrl])
	return [content, original, setContent, reset, cancel]
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
