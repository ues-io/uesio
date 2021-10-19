import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, component } from "@uesio/ui"

interface EmailFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	value: string
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
	placeholder?: string
}

const FieldLabel = component.registry.getUtility("io.fieldlabel")

const EmailField: FunctionComponent<EmailFieldProps> = (props) => {
	const { setValue, value, mode, hideLabel, context, label, placeholder } =
		props
	const readonly = mode === "READ"
	const width = props.definition?.width as string
	const classes = styles.useUtilityStyles(
		{
			root: {
				...(width && { width }),
			},
			input: {},
			readonly: {},
		},
		props
	)

	return (
		<div className={classes.root}>
			<FieldLabel label={label} hide={hideLabel} context={context} />
			<input
				value={value}
				className={styles.cx(
					classes.input,
					readonly && classes.readonly
				)}
				type="email"
				disabled={readonly}
				onChange={(event: ChangeEvent<HTMLInputElement>): void =>
					setValue(event.target.value)
				}
				placeholder={placeholder}
			/>
		</div>
	)
}

export default EmailField
