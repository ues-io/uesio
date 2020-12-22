import { FunctionComponent } from "react"
import { TextField } from "@material-ui/core"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"
import { definition, hooks, util } from "@uesio/ui"

const KeyProp: FunctionComponent<PropRendererProps> = (props) => {
	const { path, descriptor } = props
	const pathArray = util.toPath(path)
	const key = pathArray.pop()
	const uesio = hooks.useUesio(props)

	const getValue = (): definition.Definition => key

	const setValue = (value: string): void =>
		uesio.view.changeDefinitionKey(path, value)

	// Fall back to text component
	return (
		<TextField
			value={getValue()}
			label={descriptor.label}
			size="small"
			fullWidth={true}
			style={inputStyles}
			InputProps={inputProps}
			InputLabelProps={inputLabelProps}
			variant="outlined"
			onChange={(event): void => setValue(event.target.value)}
		/>
	)
}

export default KeyProp
