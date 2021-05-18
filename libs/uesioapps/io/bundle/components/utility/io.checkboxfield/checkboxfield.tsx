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
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
}

const Icon = component.registry.getUtility("io.icon")

const CheckboxField: FunctionComponent<CheckboxFieldProps> = (props) => {
	const {
		setValue,
		value,
		mode,
		hideLabel,
		path,
		fieldMetadata,
		context,
	} = props
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
			label: {},
			input: {},
			readonly: {},
		},
		props
	)

	return (
		<label className={classes.root}>
			{!hideLabel && <div className={classes.label}>{props.label}</div>}
			<input
				className={classes.native}
				checked={checked}
				type="checkbox"
				disabled={readonly}
				onChange={(event: ChangeEvent<HTMLInputElement>): void =>
					setValue(event.target.checked)
				}
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
