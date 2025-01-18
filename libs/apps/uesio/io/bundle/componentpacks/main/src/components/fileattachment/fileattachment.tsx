import { definition, context, api, signal } from "@uesio/ui"
import { TextOptions } from "../../utilities/filetext/filetext"

import UserFile from "../../utilities/userfile/userfile"
import { UserFileMetadata } from "../field/field"

type FileDefinition = {
  id?: string
  displayAs?: string
  accept?: string
  mode?: context.FieldMode
  textOptions?: TextOptions
  // Signals to run after a file is uploaded
  onUploadSignals?: signal.SignalDefinition[]
  // Signals to run after a file is deleted
  onDeleteSignals?: signal.SignalDefinition[]
}

const FileAttachment: definition.UC<FileDefinition> = (props) => {
  const { context, definition } = props
  const {
    accept,
    displayAs,
    mode = context.getFieldMode(),
    onUploadSignals,
    onDeleteSignals,
    textOptions,
  } = definition

  const id = api.component.getComponentIdFromProps(props)

  const record = context.getRecord()

  // If we don't have a record in context, bail
  if (!record) return null

  const collectionName = record.getWire().getCollection().getFullName()

  if (collectionName !== "uesio/core.userfile")
    throw new Error(
      "Wrong Record Type In Context: " +
        collectionName +
        " Expecting a userfile",
    )

  const userFile = record.source as UserFileMetadata

  return (
    <UserFile
      id={id}
      accept={accept}
      displayAs={displayAs}
      userFile={userFile}
      onUpload={async (uploadResult) => {
        record.setAll(uploadResult)
        if (onUploadSignals) {
          await api.signal.getHandler(
            onUploadSignals,
            context.addComponentFrame(props.componentType as string, {
              file: uploadResult,
            }),
          )?.()
        }
      }}
      onDelete={async (deleteResult) => {
        if (onDeleteSignals) {
          await api.signal.getHandler(
            onDeleteSignals,
            context.addComponentFrame(props.componentType as string, {
              deleteResult,
            }),
          )?.()
        }
      }}
      onChange={(value) => {
        record.update("uesio/core.data", value, context)
      }}
      context={context}
      mode={mode}
      textOptions={textOptions}
    />
  )
}

export default FileAttachment
