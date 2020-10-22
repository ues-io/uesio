import React, { ReactElement } from "react"
import {
	ImageUploadProps,
	ImageUploadDefinition,
} from "./imageuploaddefinition"
import ImageUpload from "./imageupload"
import { hooks } from "@uesio/ui"

const ImageUploadBuilder = (props: ImageUploadProps): ReactElement => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as ImageUploadDefinition
	return <ImageUpload {...props} definition={definition}></ImageUpload>
}

export default ImageUploadBuilder
