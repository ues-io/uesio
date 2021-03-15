import { FunctionComponent } from "react"
import { FormColumnProps, FormColumnDefinition } from "./formcolumndefinition"
import FormColumn from "./formcolumn"
import { hooks } from "@uesio/ui"

const FormColumnBuilder: FunctionComponent<FormColumnProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as FormColumnDefinition
	return <FormColumn {...props} definition={definition} />
}

export default FormColumnBuilder
