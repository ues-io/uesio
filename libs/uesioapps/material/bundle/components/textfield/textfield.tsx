import React, { ChangeEvent, FunctionComponent } from "react"

import { material, definition } from "@uesio/ui"
import { field } from "@uesio/constants"

type Props = {
	label: string
	setValue: (value: string) => void
	value: definition.Definition
	type?: string
	mode?: field.FieldMode
	variant?: "standard" | "filled" | "outlined"
	hideLabel?: boolean
} & definition.BaseProps

const useStyles = material.makeStyles((theme) => ({
	root: {
		margin: theme.spacing(1),
	},
}))

const TextField: FunctionComponent<Props> = ({
	hideLabel,
	type,
	mode,
	label,
	value,
	variant,
	setValue,
}) => {
	const classes = useStyles()
	return (
		<material.TextField
			className={classes.root}
			fullWidth={true}
			InputLabelProps={{
				disableAnimation: true,
				shrink: true,
			}}
			InputProps={{
				readOnly: mode === "READ",
				disableUnderline: mode === "READ",
			}}
			size="small"
			// See: https://github.com/mui-org/material-ui/issues/15697
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			variant={variant as any}
			type={type}
			multiline={type === "LONGTEXT"}
			value={value}
			onChange={(event: ChangeEvent<HTMLInputElement>): void =>
				setValue(event.target.value)
			}
			{...(!hideLabel && { label })}
		/>
	)
}

TextField.displayName = "TextField"

export default TextField
