import * as React from "react"

import { material, definition, context } from "uesio"

const useStyles = material.makeStyles((theme) => ({
	root: {
		margin: theme.spacing(1),
	},
}))

type Props = {
	hideLabel: boolean
	label: string
	setValue: (value: boolean) => void
	value: definition.Definition
	mode?: context.FieldMode
} & definition.BaseProps

const CheckBoxField = (props: Props): React.ReactElement | null => {
	const classes = useStyles(props)
	const hideLabel = props.hideLabel
	const mode = props.mode

	return (
		<material.Checkbox
			{...{
				className: classes.root,
				...(!hideLabel && {
					label: props.label,
				}),
				checked: !!props.value,
				disabled: mode === "READ",
				fullWidth: true,
				InputLabelProps: {
					disableAnimation: true,
					shrink: true,
				},
				onChange: (event): void => {
					props.setValue(event.target.checked)
				},
			}}
		></material.Checkbox>
	)
}

CheckBoxField.displayName = "CheckBoxField"

export default CheckBoxField
