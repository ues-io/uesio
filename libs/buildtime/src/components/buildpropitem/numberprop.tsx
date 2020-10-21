import React, { ReactElement } from "react"
import { TextField } from "@material-ui/core"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"

function NumberProp(props: PropRendererProps): ReactElement {
	const { descriptor } = props

	// Fall back to text component
	return (
		<TextField
			{...{
				value: props.getValue(),
				label: descriptor.label,
				size: "small",
				type: "number",
				fullWidth: true,
				style: inputStyles,
				InputProps: inputProps,
				InputLabelProps: inputLabelProps,
				variant: "outlined",
				onChange: (event): void => {
					props.setValue(parseInt(event.target.value))
				},
			}}
		></TextField>
	)
}

export default NumberProp
