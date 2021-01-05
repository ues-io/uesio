import React, { FunctionComponent, useContext } from "react"
import { TextField } from "@material-ui/core"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"
import { hooks, util } from "@uesio/ui"
import { SelectWireContext } from "../toolbar/SelectWireContext"

const KeyProp: FunctionComponent<PropRendererProps> = (props) => {
	const selectedWireContext = useContext(SelectWireContext)
	const { path, descriptor } = props
	const pathArray = util.toPath(path)
	const key = pathArray.pop()
	const uesio = hooks.useUesio(props)

	console.log("selectedWireContext", selectedWireContext)
	// Fall back to text component
	return (
		<TextField
			value={key}
			label={descriptor.label}
			size="small"
			fullWidth={true}
			style={inputStyles}
			InputProps={inputProps}
			InputLabelProps={inputLabelProps}
			variant="outlined"
			onChange={(event): void =>
				uesio.view.changeDefinitionKey(path, event.target.value)
			}
		/>
	)
}

export default KeyProp
