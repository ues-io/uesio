import React, { FunctionComponent } from "react"
import { TextField, MenuItem, Checkbox, ListItemText } from "@material-ui/core"
import { builder } from "@uesio/ui"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"

const MultiSelectProp: FunctionComponent<PropRendererProps> = (props) => {
	const descriptor = props.descriptor as builder.MultiSelectProp
	const { definition } = props

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
			onChange={(event): void => {
				console.log("multi", event.target.value)
				props.setValue(event.target.value)
			}}
		>
			{descriptor?.options.map((option: builder.PropertySelectOption) => {
				return (
					<MenuItem key={option.value} value={option.value}>
						<Checkbox checked={value.indexOf(option.value) > -1} />
						<ListItemText primary={option.label} />
					</MenuItem>
				)
			})}
		</TextField>
	)
}

export default MultiSelectProp
