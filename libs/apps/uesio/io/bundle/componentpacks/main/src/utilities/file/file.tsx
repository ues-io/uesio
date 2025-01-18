import { definition, styles, context } from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"
import Tile from "../tile/tile"
import Icon from "../icon/icon"
import UploadArea from "../uploadarea/uploadarea"
import { useRef } from "react"

type FileInfo = {
  url: string
  name: string
  mimetype: string
}

interface FileUtilityProps {
  id?: string
  mode?: context.FieldMode
  fileInfo?: FileInfo
  onUpload: (files: FileList | null) => void
  onDelete?: () => void
  accept?: string
}

const StyleDefaults = Object.freeze({
  root: [],
  input: [],
  readonly: [],
  selecteditemwrapper: [],
  selectediteminner: [],
  editbutton: [],
  uploadarea: [],
  emptystate: [],
})

const File: definition.UtilityComponent<FileUtilityProps> = (props) => {
  const { context, fileInfo, onUpload, onDelete, accept, mode } = props

  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.filefield",
  )

  const uploadLabelId = nanoid()
  const deleteLabelId = nanoid()

  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      {mode === "EDIT" && (
        <UploadArea
          onUpload={onUpload}
          onDelete={onDelete}
          context={context}
          accept={accept}
          className={styles.cx(
            classes.uploadarea,
            !fileInfo && classes.emptystate,
          )}
          uploadLabelId={uploadLabelId}
          deleteLabelId={deleteLabelId}
          fileInputRef={fileInputRef}
          onClick={() => {
            fileInputRef.current?.click()
          }}
        >
          <div>Click or drag your file here to upload.</div>
        </UploadArea>
      )}

      {
        <Tile
          context={context}
          className={styles.cx(classes.root, classes.input, classes.readonly)}
        >
          {fileInfo && (
            <div className={classes.selecteditemwrapper}>
              <div className={classes.selectediteminner}>{fileInfo.name}</div>
              <a href={fileInfo.url}>
                <button
                  tabIndex={-1}
                  className={classes.editbutton}
                  type="button"
                >
                  <Icon icon="file_download" context={context} />
                </button>
              </a>
              {mode === "EDIT" && (
                <label htmlFor={deleteLabelId}>
                  <Icon
                    icon="delete"
                    className={classes.editbutton}
                    context={context}
                  />
                </label>
              )}
            </div>
          )}
        </Tile>
      }
    </>
  )
}

export type { FileInfo }

export default File
