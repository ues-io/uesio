import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, component } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	placeholder?: string
}

const TextField: FunctionComponent<TextFieldProps> = (props) => {
	const { setValue, value, mode, placeholder } = props
	const readonly = mode === "READ"
	const classes = styles.useUtilityStyles(
		{
			input: {},
			readonly: {},
		},
		props
	)

	return (
		<input
			value={value || ""}
			className={styles.cx(classes.input, readonly && classes.readonly)}
			type="text"
			disabled={readonly}
			onChange={(event: ChangeEvent<HTMLInputElement>): void =>
				setValue(event.target.value)
			}
			placeholder={placeholder}
		/>
	)
}

export default TextField
