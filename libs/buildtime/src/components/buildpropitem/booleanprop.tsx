import React, { FunctionComponent } from "react"
import {
	FormControlLabel,
	Checkbox,
	Switch,
	TextField,
} from "@material-ui/core"
import { builder } from "@uesio/ui"
import {
	PropRendererProps,
	inputLabelProps,
	inputStyles,
	inputProps,
} from "./proprendererdefinition"

const BooleanProp: FunctionComponent<PropRendererProps> = ({
	descriptor,
	getValue,
	setValue,
}) => {
	const selected = getValue() as boolean

	switch ((descriptor as builder.BooleanProp).displaytype) {
		case "switch":
			return (
				<FormControlLabel
					control={
						<Switch
							checked={selected}
							onChange={(event): void => {
								setValue(event.target.checked)
							}}
						/>
					}
					label={descriptor.label}
				/>
			)
		case "select": {
			const optionslist: builder.PropertySelectOption[] = [
				{
					value: "true",
					label: "True",
				},
				{
					value: "false",
					label: "False",
				},
			]

			return (
				<TextField
					select={true}
					SelectProps={{ native: true }}
					variant="outlined"
					InputProps={inputProps}
					InputLabelProps={inputLabelProps}
					style={inputStyles}
					size="small"
					value={selected}
					label={descriptor.label}
					fullWidth={true}
					onChange={(event): void => {
						event.target.value == "true"
							? setValue(true)
							: setValue(false)
					}}
				>
					{optionslist.map((option: builder.PropertySelectOption) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</TextField>
			)
		}
		default:
			//Checkbox as default
			return (
				<FormControlLabel
					control={
						<Checkbox
							checked={selected}
							onChange={(event): void => {
								setValue(event.target.checked)
							}}
						/>
					}
					label={descriptor.label}
				/>
			)
	}
}

export default BooleanProp
