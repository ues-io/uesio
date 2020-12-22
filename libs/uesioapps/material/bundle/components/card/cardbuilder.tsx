import { FunctionComponent } from "react";
import { hooks } from "@uesio/ui"
import { CardProps, CardDefinition } from "./carddefinition"
import Card from "./card"

const TableBuilder: FunctionComponent<CardProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as CardDefinition
	return <Card {...props} definition={definition} />
}

export default TableBuilder
