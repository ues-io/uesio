import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"

import { component, collection, wire } from "@uesio/ui"

const ImageUpload = component.registry.getUtility("io.imageupload")

const FileProp: FunctionComponent<PropRendererProps> = ({
	getValue,
	descriptor,
	setValue,
	context,
	definition,
}) => {
	const wire = context.getWire()
	const collection = wire?.getCollection()
	// const { fieldId, hideLabel, id, displayAs } = definition

	// const fieldMetadata = collection?.getField(fieldId)

	console.log("look here 	definition", descriptor)

	const imageUploadProps = {
		context,
		label: "label here",
	}

	return (
		// Fall back to text component
		<ImageUpload {...imageUploadProps} />
	)
}

export default FileProp
