import React, { ReactElement } from "react"
import { TextField } from "@material-ui/core"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"

function TextProp(props: PropRendererProps): ReactElement {
	const { descriptor } = props

	// Fall back to text component
	return (
		<TextField
			{...{
				value: props.getValue(),
				label: descriptor.label,
				size: "small",
				fullWidth: true,
				style: inputStyles,
				InputProps: inputProps,
				InputLabelProps: inputLabelProps,
				variant: "outlined",
				onChange: (event): void => {
					props.setValue(event.target.value)
				},
			}}
		></TextField>
	)
}

export default TextProp
