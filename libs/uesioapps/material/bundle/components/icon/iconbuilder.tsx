import React, { ReactElement } from "react"
import { IconProps, IconDefinition } from "./icondefinition"
import Icon from "./icon"
import { hooks } from "@uesio/ui"

const IconBuilder = (props: IconProps): ReactElement => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as IconDefinition
	return <Icon {...props} definition={definition} />
}

export default IconBuilder
