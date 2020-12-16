import React, { FunctionComponent } from "react"
import { hooks } from "@uesio/ui"
import { TypographyProps, TypographyDefinition } from "./typographydefinition"
import Typography from "./typography"

const TypographyBuilder: FunctionComponent<TypographyProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as TypographyDefinition
	return <Typography {...props} definition={definition} />
}

export default TypographyBuilder
