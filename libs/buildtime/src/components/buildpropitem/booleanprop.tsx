import React, { ReactElement } from "react"
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

function BooleanProp(props: PropRendererProps): ReactElement {
	const descriptor = props.descriptor as builder.BooleanProp
	const { definition } = props
	const selected = props.getValue() as boolean

	switch (descriptor.displaytype) {
		case "switch":
			return (
				<FormControlLabel
					control={
						<Switch
							{...{
								checked: selected,
								onChange: (event): void => {
									props.setValue(event.target.checked)
								},
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
					value={props.getValue()}
					label={descriptor.label}
					fullWidth={true}
					onChange={(event): void => {
						if (event.target.value == "true") {
							props.setValue(true)
						} else {
							props.setValue(false)
						}
					}}
				>
					{optionslist?.map(
						(option: builder.PropertySelectOption) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						)
					)}
				</TextField>
			)
		}
		default:
			//Checkbox as default
			return (
				<FormControlLabel
					control={
						<Checkbox
							{...{
								checked: selected,
								onChange: (event): void => {
									props.setValue(event.target.checked)
								},
							}}
						/>
					}
					label={descriptor.label}
				/>
			)
	}
}

export default BooleanProp
