import React, { FunctionComponent } from "react"
import { TextField, MenuItem, Checkbox, ListItemText } from "@material-ui/core"
import { builder } from "@uesio/ui"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"

const MultiSelectProp: FunctionComponent<PropRendererProps> = ({
	definition,
	setValue,
	descriptor,
}) => {
	const value = (definition?.[descriptor.name] || []) as string[]

	return (
		<TextField
			select={true}
			SelectProps={{
				multiple: true,
				renderValue: (selected) => (selected as string[]).join(", "),
			}}
			variant="outlined"
			InputProps={inputProps}
			InputLabelProps={inputLabelProps}
			style={inputStyles}
			size="small"
			value={value}
			label={descriptor.label}
			fullWidth={true}
			onChange={(event): void => setValue(event.target.value)}
		>
			{(descriptor as builder.MultiSelectProp).options.map((option) => (
				<MenuItem key={option.value} value={option.value}>
					<Checkbox checked={value.indexOf(option.value) > -1} />
					<ListItemText primary={option.label} />
				</MenuItem>
			))}
		</TextField>
	)
}

export default MultiSelectProp
