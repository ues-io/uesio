import { definition, styles, context } from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"
import Icon from "../icon/icon"

import UploadArea from "../uploadarea/uploadarea"
import { FileInfo } from "../file/file"

interface FileImageProps {
  id?: string
  mode?: context.FieldMode
  fileInfo?: FileInfo
  onUpload: (files: FileList | null) => void
  onDelete?: () => void
  accept?: string
}

interface EditButtonsProps {
  mode?: context.FieldMode
  fileInfo?: FileInfo
  uploadLabelId: string
  deleteLabelId: string
}

const StyleDefaults = Object.freeze({
  root: ["relative", "group"],
  actionicon: [
    "group-hover:block",
    "cursor-pointer",
    "p-2",
    "text-white",
    "backdrop-brightness-75",
    "hidden",
    "absolute",
    "top-0",
    "m-2",
    "leading-none",
  ],
  image: ["w-full"],
  editicon: ["right-0"],
  deleteicon: ["left-0"],
  nofile: ["flex", "bg-slate-100", "justify-center"],
  nofileicon: ["text-4xl", "p-8", "text-slate-400"],
})

const EditButtons: definition.UtilityComponent<EditButtonsProps> = (props) => {
  const { mode, fileInfo, uploadLabelId, deleteLabelId, classes, context } =
    props
  if (!classes) return
  if (mode !== "EDIT") return
  // only show the edit button if we're not an attachment
  // or we don't have any file info
  const showEditButton = !fileInfo || !fileInfo?.isAttachment
  const showDeleteButton = !!fileInfo
  return (
    <>
      {showEditButton && (
        <label
          className={styles.cx(classes.editicon, classes.actionicon)}
          htmlFor={uploadLabelId}
        >
          <Icon context={context} icon="edit" />
        </label>
      )}
      {showDeleteButton && (
        <label
          className={styles.cx(classes.deleteicon, classes.actionicon)}
          htmlFor={deleteLabelId}
        >
          <Icon context={context} icon="delete" />
        </label>
      )}
    </>
  )
}

const FileImage: definition.UtilityComponent<FileImageProps> = (props) => {
  const { context, mode, fileInfo, accept, onUpload, onDelete } = props

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const uploadLabelId = nanoid()
  const deleteLabelId = nanoid()

  return (
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
      {fileInfo ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- TODO See https://github.com/ues-io/uesio/issues/4489
        <img className={classes.image} src={fileInfo.url} />
      ) : (
        <div className={classes.nofile}>
          <Icon
            className={classes.nofileicon}
            context={context}
            icon="person"
          />
        </div>
      )}
    </UploadArea>
  )
}

export { StyleDefaults, EditButtons }

export default FileImage
