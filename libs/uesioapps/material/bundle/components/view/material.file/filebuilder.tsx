import React, { FunctionComponent } from "react"
import { FileProps, FileDefinition } from "./filedefinition"
import File from "./file"
import { hooks } from "@uesio/ui"

const FileBuilder: FunctionComponent<FileProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as FileDefinition
	return <File {...props} definition={definition} />
}

export default FileBuilder
