import React, { ReactElement } from "react"
import { hooks } from "@uesio/ui"
import { CardProps, CardDefinition } from "./carddefinition"
import Card from "./card"

function TableBuilder(props: CardProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as CardDefinition
	return <Card {...props} definition={definition}></Card>
}

export default TableBuilder
