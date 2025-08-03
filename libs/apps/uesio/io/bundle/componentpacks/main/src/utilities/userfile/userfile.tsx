import { definition, context, collection, api, wire, platform } from "@uesio/ui"
import { UserFileMetadata } from "../../components/field/field"
import File, { FileInfo } from "../file/file"
import FileImage from "../fileimage/fileimage"
import FilePreview from "../filepreview/filepreview"
import FileText, { TextOptions } from "../filetext/filetext"
import FileVideo from "../filevideo/filevideo"

interface UserFileUtilityProps {
  id?: string
  mode?: context.FieldMode
  displayAs?: string
  userFile?: UserFileMetadata
  collectionId?: string
  recordId?: string
  fieldId?: string
  onUpload?: (result: wire.PlainWireRecord) => Promise<void>
  onDelete?: (result: platform.BotResponse) => Promise<void>
  onChange?: (value: string) => void
  accept?: string
  textOptions?: TextOptions
  readonly?: boolean
}

const UserFile: definition.UtilityComponent<UserFileUtilityProps> = (props) => {
  const {
    userFile,
    context,
    onUpload,
    onDelete,
    onChange,
    mode,
    id,
    accept,
    displayAs,
    textOptions,
    variant,
    readonly,
  } = props

  const userFileId = userFile?.[collection.ID_FIELD]

  const fileModDate = userFile?.[collection.UPDATED_AT_FIELD]
  const fileUrl = api.file.getUserFileURL(context, userFileId, fileModDate)
  const downloadFileUrl = api.file.getUserFileURL(
    context,
    userFileId,
    fileModDate,
    true,
  )

  const fileInfo: FileInfo | undefined =
    userFile && fileUrl
      ? {
          url: fileUrl,
          name: userFile["uesio/core.path"],
          mimetype: userFile["uesio/core.mimetype"],
          isAttachment: !userFile["uesio/core.fieldid"],
        }
      : undefined

  const onFileUpload = async (file: FileList | File | null) => {
    if (!file) return
    if (file instanceof FileList) {
      if (file.length === 0) return
      file = file[0]
    }

    const collectionID =
      props.collectionId || userFile?.["uesio/core.collectionid"]
    const recordID = props.recordId || userFile?.["uesio/core.recordid"]
    const fieldID = props.fieldId || userFile?.["uesio/core.fieldid"]

    if (!recordID || !collectionID) return
    const uploadResult = await api.file.uploadFile(
      context,
      {
        collectionID,
        recordID,
        fieldID,
        params: context.getParams(),
      },
      file,
    )
    await onUpload?.(uploadResult)
    return uploadResult
  }

  const onFileDelete = async () => {
    if (!userFileId) return
    const deleteResult = await api.file.deleteFile(context, userFileId)
    await onDelete?.(deleteResult)
    return deleteResult
  }

  const onFilePreview = async () => {
    if (!fileUrl) return
    // TODO: There should likely be an API for the equivalent of /route/operations.ts redirect function
    // but the only way to get to it is via a signal which is not ideal to be calling from a utility
    // component as it should use our apis. For now, implementing with native js calls but API should
    // be evaluated and expanded.
    window.open(fileUrl, "_blank")
  }

  const onFileDownload = async () => {
    if (!downloadFileUrl) return
    // TODO: There should likely be an API for the equivalent of /route/operations.ts redirect function
    // but the only way to get to it is via a signal which is not ideal to be calling from a utility
    // component as it should use our apis. For now, implementing with native js calls but API should
    // be evaluated and expanded.
    window.open(downloadFileUrl, "_blank")
  }

  // Right now this only works if a file record is in context
  const common = {
    context,
    mode,
    id,
    fileInfo,
    onUpload: onFileUpload,
    onDelete: onFileDelete,
    onPreview: onFilePreview,
    onDownload: onFileDownload,
    accept,
    displayAs,
    variant,
    readonly,
  }

  switch (displayAs) {
    case "TEXT":
    case "MARKDOWN":
      return (
        <FileText
          {...common}
          userFile={userFile}
          textOptions={textOptions}
          onChange={onChange}
        />
      )
    case "IMAGE":
      return <FileImage {...common} />
    case "VIDEO":
      return <FileVideo {...common} />
    case "PREVIEW":
      return <FilePreview {...common} />
    default:
      return <File {...common} />
  }
}

export default UserFile
