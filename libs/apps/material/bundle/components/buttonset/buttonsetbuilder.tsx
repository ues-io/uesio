import React, { ReactElement } from "react"
import { hooks } from "uesio"
import { ButtonSetProps, ButtonSetDefinition } from "./buttonsetdefinition"
import ButtonSet from "./buttonset"

function ButtonSetBuilder(props: ButtonSetProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as ButtonSetDefinition
	return <ButtonSet {...props} definition={definition}></ButtonSet>
}

export default ButtonSetBuilder
