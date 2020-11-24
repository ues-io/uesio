import React, { ReactElement } from "react"
import { TextField } from "@material-ui/core"
import { builder } from "@uesio/ui"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"

interface SelectPropRendererProps extends PropRendererProps {
	descriptor: builder.SelectProp
}

function SelectProp(props: SelectPropRendererProps): ReactElement {
	const descriptor = props.descriptor

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
			{descriptor.options?.map((option: builder.PropertySelectOption) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</TextField>
	)
}

export default SelectProp
