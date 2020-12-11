import React, { FunctionComponent } from "react"
import { TextField } from "@material-ui/core"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"

const TextProp: FunctionComponent<PropRendererProps> = ({
	getValue,
	descriptor,
	setValue,
}) => (
	// Fall back to text component
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

export default TextProp
