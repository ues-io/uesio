import { FunctionComponent } from "react"
import {
	definition,
	styles,
	context,
	collection,
	component,
	wire,
} from "@uesio/ui"

interface CheckboxFieldProps extends definition.UtilityProps {
	setValue: (value: boolean) => void
	value: wire.FieldValue
	fieldMetadata: collection.Field
	mode?: context.FieldMode
}

const Icon = component.registry.getUtility("io.icon")

const CheckboxField: FunctionComponent<CheckboxFieldProps> = (props) => {
	const { setValue, value, mode, context } = props
	const readonly = mode === "READ"

	const checked = value === true
	const classes = styles.useUtilityStyles(
		{
			native: {
				opacity: "0",
				position: "absolute",
				cursor: readonly ? "inherit" : "pointer",
			},
			input: {
				opacity: readonly ? 0.5 : 1,
				cursor: readonly ? "inherit" : "pointer",
			},
			readonly: {},
		},
		props
	)

	return (
		<div className={classes.input}>
			<input
				className={classes.native}
				checked={checked}
				type="checkbox"
				disabled={readonly}
				onChange={(event) => setValue(event.target.checked)}
			/>
			<Icon
				context={context}
				icon={checked ? "check_box" : "check_box_outline_blank"}
			/>
		</div>
	)
}

export default CheckboxField
