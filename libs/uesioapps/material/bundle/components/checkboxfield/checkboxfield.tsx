import React, { FunctionComponent } from "react"

import { material, definition } from "@uesio/ui"
import { field } from "@uesio/constants"

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
	mode?: field.FieldMode
} & definition.BaseProps

const CheckBoxField: FunctionComponent<Props> = (props) => {
	const classes = useStyles(props)
	const { hideLabel, mode, value, setValue, label, definition } = props

	return (
		<material.Checkbox
			color={
				// find used for the sake of type checking
				(["primary", "secondary"].find(
					(color) => color === definition?.color
				) || "primary") as "primary" | "secondary"
			}
			className={classes.root}
			checked={!!value}
			disabled={mode === "READ"}
			onChange={(event): void => setValue(event.target.checked)}
			{...(!hideLabel && { label })}
		/>
	)
}

CheckBoxField.displayName = "CheckBoxField"

export default CheckBoxField
