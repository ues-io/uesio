import { ChangeEvent, FunctionComponent } from "react"
import {
	definition,
	styles,
	context,
	collection,
	component,
	wire,
} from "@uesio/ui"

interface CheckboxFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: boolean) => void
	value: wire.FieldValue
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
}

const Icon = component.registry.getUtility("io.icon")
const FieldLabel = component.registry.getUtility("io.fieldlabel")

const CheckboxField: FunctionComponent<CheckboxFieldProps> = (props) => {
	const { setValue, value, mode, hideLabel, context, label } = props
	const readonly = mode === "READ"
	const width = props.definition?.width as string
	const checked = value === true
	const classes = styles.useUtilityStyles(
		{
			root: {
				...(width && { width }),
			},
			native: {
				opacity: "0",
				position: "absolute",
			},
			input: {},
			readonly: {},
		},
		props
	)

	return (
		<label className={classes.root}>
			<FieldLabel label={label} hide={hideLabel} context={context} />
			<input
				className={classes.native}
				checked={checked}
				type="checkbox"
				disabled={readonly}
				onChange={(event) => setValue(event.target.checked)}
			/>
			<div className={classes.input}>
				<Icon
					context={context}
					icon={checked ? "check_box" : "check_box_outline_blank"}
				/>
			</div>
		</label>
	)
}

export default CheckboxField
