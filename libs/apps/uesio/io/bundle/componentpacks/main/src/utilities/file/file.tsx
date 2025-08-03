import { definition, styles, context } from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"
import Tile from "../tile/tile"
import UploadArea from "../uploadarea/uploadarea"
import { useRef } from "react"
import MenuButton from "../menubutton/menubutton"

type MenuItem = {
  id: string
  label: string
}

type FileInfo = {
  url: string
  name: string
  mimetype: string
  isAttachment: boolean
}

interface FileUtilityProps {
  id?: string
  mode?: context.FieldMode
  fileInfo?: FileInfo
  onUpload: (files: FileList | null) => void
  onDelete?: () => void
  onPreview?: () => void
  onDownload?: () => void
  accept?: string
}

const StyleDefaults = Object.freeze({
  root: [],
  input: [],
  readonly: [],
  selecteditemwrapper: [],
  selectediteminner: [],
  editbutton: [],
  menubutton: [],
  uploadarea: [],
  emptystate: [],
})

const File: definition.UtilityComponent<FileUtilityProps> = (props) => {
  const {
    context,
    fileInfo,
    onUpload,
    onDelete,
    onPreview,
    onDownload,
    accept,
    mode,
  } = props

  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.filefield",
  )

  const uploadLabelId = nanoid()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const menuItems: MenuItem[] = [
    ...(onPreview
      ? [
          {
            id: "preview",
            label: "Preview",
          },
        ]
      : []),
    ...(onDownload
      ? [
          {
            id: "download",
            label: "Download",
          },
        ]
      : []),
    ...(mode === "EDIT" && onDelete
      ? [
          {
            id: "delete",
            label: "Delete",
          },
        ]
      : []),
  ]

  return (
    <>
      {mode === "EDIT" && (
        <UploadArea
          onUpload={fileInfo?.isAttachment ? undefined : onUpload}
          context={context}
          accept={accept}
          className={styles.cx(
            classes.uploadarea,
            !fileInfo && classes.emptystate,
          )}
          uploadLabelId={uploadLabelId}
          fileInputRef={fileInputRef}
          onClick={() => {
            fileInputRef.current?.click()
          }}
        >
          <div>Click or drag your file here to upload.</div>
        </UploadArea>
      )}

      {fileInfo && fileInfo.url && (
        <Tile
          context={context}
          className={styles.cx(classes.root, classes.input, classes.readonly)}
        >
          {
            <div className={classes.selecteditemwrapper}>
              <div className={classes.selectediteminner}>{fileInfo.name}</div>
              <MenuButton
                buttonVariant="uesio/appkit.navicon"
                className={classes.menubutton}
                itemRenderer={(item: MenuItem) => item.label}
                items={menuItems}
                getItemKey={(item: MenuItem) => item.id}
                icon="more_vert"
                context={context}
                defaultPlacement="bottom-end"
                onSelect={(item: MenuItem) => {
                  switch (item.id) {
                    case "preview":
                      onPreview?.()
                      break
                    case "download":
                      onDownload?.()
                      break
                    case "delete":
                      onDelete?.()
                      break
                  }
                }}
              />
            </div>
          }
        </Tile>
      )}
    </>
  )
}

export type { FileInfo }

export default File
