import React, { FunctionComponent } from "react"
import { TextField } from "@material-ui/core"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"
import { hooks, util } from "@uesio/ui"

const KeyProp: FunctionComponent<PropRendererProps> = (props) => {
	const { path, descriptor } = props
	const pathArray = util.toPath(path)
	const key = pathArray.pop()
	const uesio = hooks.useUesio(props)

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
			onChange={(event): void => {
				const inputValue = event.target.value
				uesio.builder.setSelectedNode?.(`["wires"]["${inputValue}"]`)
				uesio.view.changeDefinitionKey(path, inputValue)
			}}
		/>
	)
}

export default KeyProp
