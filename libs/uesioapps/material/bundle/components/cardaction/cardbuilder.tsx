import { FunctionComponent } from "react";
import { hooks } from "@uesio/ui"
import { CardActionProps, CardActionDefinition } from "./cardactiondefinition"
import CardAction from "./cardaction"

const CardActionBuilder: FunctionComponent<CardActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as CardActionDefinition
	return <CardAction {...props} definition={definition} />
}

export default CardActionBuilder
