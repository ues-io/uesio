import * as React from "react"

import { material, definition, context } from "@uesio/ui"

const useStyles = material.makeStyles((theme) => ({
	root: {
		margin: theme.spacing(1),
	},
}))

type Props = {
	label: string
	setValue: (value: string) => void
	value: definition.Definition
	type?: string
	mode?: context.FieldMode
	variant?: "standard" | "filled" | "outlined"
	hideLabel?: boolean
} & definition.BaseProps

const TextField = (props: Props): React.ReactElement | null => {
	const classes = useStyles(props)

	const hideLabel = props.hideLabel
	const type = props.type
	const mode = props.mode

	return (
		<material.TextField
			{...{
				className: classes.root,
				...(!hideLabel && {
					label: props.label,
				}),
				fullWidth: true,
				InputLabelProps: {
					disableAnimation: true,
					shrink: true,
				},
				InputProps: {
					readOnly: mode === "READ",
					disableUnderline: mode === "READ",
				},
				size: "small",
				// See: https://github.com/mui-org/material-ui/issues/15697
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				variant: props.variant as any,
				multiline: type === "LONGTEXT",
				value: props.value,
				onChange: (event): void => {
					props.setValue(event.target.value)
				},
			}}
		></material.TextField>
	)
}

TextField.displayName = "TextField"

export default TextField
