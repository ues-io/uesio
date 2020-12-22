import { FunctionComponent } from "react";
import { hooks } from "@uesio/ui"
import { ButtonSetProps, ButtonSetDefinition } from "./buttonsetdefinition"
import ButtonSet from "./buttonset"

const ButtonSetBuilder: FunctionComponent<ButtonSetProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as ButtonSetDefinition
	return <ButtonSet {...props} definition={definition} />
}

export default ButtonSetBuilder
