import React, { FunctionComponent } from "react"
import { hooks } from "@uesio/ui"
import { CardActionProps } from "./cardactiondefinition"
import CardAction from "./cardaction"

const CardActionBuilder: FunctionComponent<CardActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path)
	return <CardAction {...props} definition={definition} />
}

export default CardActionBuilder
