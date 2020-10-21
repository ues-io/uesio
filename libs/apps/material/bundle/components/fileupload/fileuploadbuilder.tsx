import React, { ReactElement } from "react"
import { FileUploadProps, FileUploadDefinition } from "./fileuploaddefinition"
import FileUpload from "./fileupload"
import { hooks } from "uesio"

const FileUploadBuilder = (props: FileUploadProps): ReactElement => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as FileUploadDefinition
	return <FileUpload {...props} definition={definition}></FileUpload>
}

export default FileUploadBuilder
