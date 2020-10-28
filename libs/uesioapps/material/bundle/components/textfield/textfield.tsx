import React, { ChangeEvent, FunctionComponent } from "react"

import { material, definition, context } from "@uesio/ui"

const thomas = 'test'
console.log(nothing);

type Props = {
	label: string
	setValue: (value: string) => void
	value: definition.Definition
	type?: string
	mode?: context.FieldMode
	variant?: "standard" | "filled" | "outlined"
	hideLabel?: boolean
} & definition.BaseProps

const useStyles = material.makeStyles((theme) => ({
	root: {
		margin: theme.spacing(1),
	},
}))

const TextField: FunctionComponent<Props> = (props: Props) => {
	const { hideLabel, type, mode, label, value, variant, setValue } = props
	const classes = useStyles(props)
	return (
		<material.TextField
			{...{
				className: classes.root,
				...(!hideLabel && { label }),
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
				variant: variant as any,
				type,
				multiline: type === "LONGTEXT",
				value,
				onChange: (event: ChangeEvent<HTMLInputElement>): void => {
					setValue(event.target.value)
				},
			}}
		/>
	)
}

TextField.displayName = "TextField"

export default TextField
