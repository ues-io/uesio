import { Context } from "../context/context"
import { useEffect, useState } from "react"
import { PlainWireRecord } from "../wireexports"
import { ID_FIELD, UPDATED_AT_FIELD } from "../collectionexports"
import { platform } from "../platform/platform"
const { deleteFile, uploadFile, getFileText } = platform

const getURL = platform.getFileURL

const getURLFromFullName = (
  context: Context,
  fullName: string,
  filePath?: string,
) => {
  const [namespace, name] = fullName.split(".")
  return getURL(context, namespace, name, undefined, filePath)
}

const getUserFileURL = (
  context: Context,
  userfileid: string | undefined,
  fileVersion?: string,
  attachment?: boolean,
) => {
  if (!userfileid) return ""
  return platform.getUserFileURL(context, userfileid, fileVersion, attachment)
}

const getAttachmentURL = (
  context: Context,
  recordid: string,
  path: string,
  fileVersion?: string,
) => {
  if (!recordid || !path) return ""
  return platform.getAttachmentURL(context, recordid, path, fileVersion)
}

const useUserFile = (
  context: Context,
  userFile: PlainWireRecord | undefined,
) => {
  const data = userFile?.["uesio/core.data"] as string
  const [content, setContent] = useState<string>(data || "")

  const userFileId = userFile?.[ID_FIELD] as string
  const updatedAt = userFile?.[UPDATED_AT_FIELD] as string
  const fileUrl = getUserFileURL(context, userFileId, updatedAt)
  useEffect(() => {
    if (data || !fileUrl) {
      setContent(data || '')
      return
    }
    const fetchData = async () => {
      const fileText = await getFileText(fileUrl)
      setContent(fileText)
    }
    fetchData()
  }, [fileUrl, data])
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId])
  return content
}

export {
  getURL,
  getURLFromFullName,
  getAttachmentURL,
  uploadFile,
  deleteFile,
  getUserFileURL,
  useFile,
  useUserFile,
}
