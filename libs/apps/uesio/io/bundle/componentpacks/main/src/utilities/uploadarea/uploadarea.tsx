import { DragEvent, RefObject } from "react"
import { definition, styles } from "@uesio/ui"

interface UploadAreaProps {
  accept?: string
  onUpload: (files: FileList | null) => void
  onDelete?: () => void
  onClick?: () => void
  uploadLabelId?: string
  deleteLabelId?: string
  fileInputRef?: RefObject<HTMLInputElement | null>
}

const StyleDefaults = Object.freeze({
  root: [],
  fileinput: ["hidden"],
})

const UploadArea: definition.UtilityComponent<UploadAreaProps> = (props) => {
  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const {
    children,
    uploadLabelId,
    deleteLabelId,
    onUpload,
    onDelete,
    accept,
    fileInputRef,
  } = props

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onUpload(e.dataTransfer.files)
  }

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const resetFile = () => {
    // Make sure the upload triggers after a delete or an upload as the browser won't trigger onChange if the same file is selected again.
    // This covers the situation where the file is deleted but also the situation where the same file based on name/path is selected
    // even though the physical file might have changed.
    if (fileInputRef?.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        className={classes.root}
        onClick={(e) => {
          if (props.onClick) {
            e.preventDefault()
            e.stopPropagation()
            props.onClick()
          }
        }}
      >
        {children}
      </div>
      <input
        className={classes.fileinput}
        type="file"
        accept={accept}
        onChange={(e) => {
          onUpload(e.target.files)
          resetFile()
        }}
        ref={fileInputRef}
        id={uploadLabelId}
      />
      {onDelete && (
        <input
          className={classes.fileinput}
          type="button"
          onClick={(e) => {
            onDelete()
            resetFile()
          }}
          id={deleteLabelId}
        />
      )}
    </>
  )
}

export default UploadArea
