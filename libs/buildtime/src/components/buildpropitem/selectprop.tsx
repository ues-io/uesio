import React, { ReactElement } from "react"
import { TextField } from "@material-ui/core"
import { builder } from "@uesio/ui"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"

function SelectProp(props: PropRendererProps): ReactElement {
	const descriptor = props.descriptor as builder.SelectProp

	return (
		<TextField
			{...{
				select: true,
				SelectProps: {
					native: true,
				},
				variant: "outlined",
				InputProps: inputProps,
				InputLabelProps: inputLabelProps,
				style: inputStyles,
				size: "small",
				value: props.getValue(),
				label: descriptor.label,
				fullWidth: true,
				onChange: (event): void => {
					props.setValue(event.target.value)
				},
			}}
		>
			<option value=""></option>
			{descriptor.options &&
				descriptor.options.map(
					(option: builder.PropertySelectOption) => {
						return (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						)
					}
				)}
		</TextField>
	)
}

export default SelectProp
