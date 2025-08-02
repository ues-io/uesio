import { definition, context } from "@uesio/ui"
import File, { FileInfo } from "../file/file"
import FileImage from "../fileimage/fileimage"
import FileVideo from "../filevideo/filevideo"

interface FilePreviewProps {
  id?: string
  mode?: context.FieldMode
  fileInfo?: FileInfo
  onUpload: (files: FileList | null) => void
  onDelete?: () => void
  onPreview?: () => void
  onDownload?: () => void
  accept?: string
}

const FilePreview: definition.UtilityComponent<FilePreviewProps> = (props) => {
  const { fileInfo } = props
  const mimeType = fileInfo?.mimetype
  if (!mimeType) return <File {...props} />

  const mime = mimeType.slice(0, mimeType.indexOf("/"))

  switch (mime) {
    case "text":
    case "application":
      return <File {...props} />
    case "image":
      return <FileImage {...props} />
    case "video":
      return <FileVideo {...props} />
    default:
      return <File {...props} />
  }
}

export default FilePreview
