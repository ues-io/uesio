import * as React from "react"

import { material, definition, context, collection } from "uesio"
import TextField from "../textfield/textfield"

const useStyles = material.makeStyles((theme) => ({
	root: {
		margin: theme.spacing(1),
	},
}))

type Props = {
	hideLabel?: boolean
	label: string
	setValue: (value: string) => void
	value: definition.Definition
	options: collection.SelectOption[] | null
	mode?: context.FieldMode
} & definition.BaseProps

const SelectField = (props: Props): React.ReactElement | null => {
	const classes = useStyles(props)
	const hideLabel = props.hideLabel
	const mode = props.mode
	const options = props.options
	const value = props.value

	if (mode === "READ") {
		const optionMatch =
			options &&
			options.find((option) => {
				return option.value === value
			})
		const valueLabel = (optionMatch && optionMatch.label) || ""
		return (
			<TextField
				{...props}
				mode={mode}
				type={"TEXT"}
				value={valueLabel}
				setValue={props.setValue}
				label={props.label}
				hideLabel={hideLabel}
			></TextField>
		)
	}

	return (
		<material.TextField
			{...{
				select: true,
				className: classes.root,
				...(!hideLabel && {
					label: props.label,
				}),
				fullWidth: true,
				InputLabelProps: {
					disableAnimation: true,
					shrink: true,
				},
				value,
				onChange: (event): void => {
					props.setValue(event.target.value as string)
				},
				size: "small",
			}}
		>
			{options &&
				options.map((option, index) => {
					return (
						<material.MenuItem key={index} value={option.value}>
							{option.label}
						</material.MenuItem>
					)
				})}
		</material.TextField>
	)
}

SelectField.displayName = "SelectField"

export default SelectField
