import React, { ReactElement } from "react"
import { hooks } from "uesio"
import { CardActionProps, CardActionDefinition } from "./cardactiondefinition"
import CardAction from "./cardaction"

function CardActionBuilder(props: CardActionProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as CardActionDefinition
	return <CardAction {...props} definition={definition}></CardAction>
}

export default CardActionBuilder
