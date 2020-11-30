import React, { ReactElement } from "react"
import { ImageProps, ImageDefinition } from "./imagedefinition"
import Image from "./image"
import { hooks } from "@uesio/ui"

const ImageBuilder = (props: ImageProps): ReactElement => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as ImageDefinition
	return <Image {...props} definition={definition} />
}

export default ImageBuilder
