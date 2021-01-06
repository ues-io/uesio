import React, { FunctionComponent, ChangeEvent } from "react"

import { material, definition, collection } from "@uesio/ui"
import { field } from "@uesio/constants"
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
	mode?: field.FieldMode
} & definition.BaseProps

const SelectField: FunctionComponent<Props> = (props) => {
	const classes = useStyles()
	const { hideLabel, mode, options, value, setValue, label } = props

	if (mode === "READ") {
		const optionMatch = options?.find((option) => option.value === value)
		const valueLabel = optionMatch?.label || ""
		return (
			<TextField
				{...props}
				mode={mode}
				type="TEXT"
				value={valueLabel}
				setValue={setValue}
				label={label}
				hideLabel={hideLabel}
			/>
		)
	}

	return (
		<material.TextField
			select={true}
			className={classes.root}
			fullWidth={true}
			InputLabelProps={{
				disableAnimation: true,
				shrink: true,
			}}
			value={value}
			onChange={(event: ChangeEvent<HTMLInputElement>): void =>
				setValue(event.target.value)
			}
			size="small"
			{...(!hideLabel && { label })}
		>
			{options?.map((option, index) => (
				<material.MenuItem key={index} value={option.value}>
					{option.label}
				</material.MenuItem>
			))}
		</material.TextField>
	)
}

export default SelectField
