import { FunctionComponent } from "react";
import {
	ImageUploadProps,
	ImageUploadDefinition,
} from "./imageuploaddefinition"
import ImageUpload from "./imageupload"
import { hooks } from "@uesio/ui"

const ImageUploadBuilder: FunctionComponent<ImageUploadProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as ImageUploadDefinition
	return <ImageUpload {...props} definition={definition} />
}

export default ImageUploadBuilder
