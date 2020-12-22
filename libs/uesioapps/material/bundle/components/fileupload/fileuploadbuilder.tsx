import { FunctionComponent } from "react";
import { FileUploadProps, FileUploadDefinition } from "./fileuploaddefinition"
import FileUpload from "./fileupload"
import { hooks } from "@uesio/ui"

const FileUploadBuilder: FunctionComponent<FileUploadProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as FileUploadDefinition
	return <FileUpload {...props} definition={definition} />
}

export default FileUploadBuilder
