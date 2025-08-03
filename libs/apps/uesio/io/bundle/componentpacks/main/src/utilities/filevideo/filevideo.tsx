import { definition, styles, context } from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"
import Icon from "../icon/icon"
import UploadArea from "../uploadarea/uploadarea"
import { EditButtons, StyleDefaults } from "../fileimage/fileimage"
import { FileInfo } from "../file/file"

interface FileVideoProps {
  id?: string
  mode?: context.FieldMode
  fileInfo?: FileInfo
  onUpload: (files: FileList | null) => void
  onDelete?: () => void
  accept?: string
  muted?: boolean
  autoplay?: boolean
  readonly?: boolean
}

const FileVideo: definition.UtilityComponent<FileVideoProps> = (props) => {
  const {
    mode,
    context,
    autoplay,
    muted,
    fileInfo,
    onUpload,
    onDelete,
    accept,
    readonly,
  } = props

  const fileUrl = fileInfo?.url

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const uploadLabelId = nanoid()
  const deleteLabelId = nanoid()
  const isEditMode = !readonly && mode === "EDIT"

  const Video = () =>
    fileInfo ? (
      <video autoPlay={autoplay || true} muted={muted || true}>
        <source src={fileUrl} />
        Your browser does not support the video tag.
      </video>
    ) : (
      <div className={classes.nofile}>
        <Icon className={classes.nofileicon} context={context} icon="movie" />
      </div>
    )

  return isEditMode ? (
    <UploadArea
      onUpload={onUpload}
      onDelete={onDelete}
      context={context}
      accept={accept}
      className={classes.root}
      uploadLabelId={uploadLabelId}
      deleteLabelId={deleteLabelId}
    >
      <EditButtons
        context={context}
        mode={mode}
        fileInfo={fileInfo}
        classes={classes}
        uploadLabelId={uploadLabelId}
        deleteLabelId={deleteLabelId}
      />
      <Video />
    </UploadArea>
  ) : (
    <div className={classes.root}>
      <Video />
    </div>
  )
}

export default FileVideo
