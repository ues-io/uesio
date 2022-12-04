import { FunctionComponent } from "react"
import { definition, styles, context } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string | null
	mode?: context.FieldMode
	placeholder?: string
	password?: boolean
}

const TextField: FunctionComponent<TextFieldProps> = (props) => {
	const { setValue, value, mode, placeholder, password } = props
	const readonly = mode === "READ"
	const classes = styles.useUtilityStyles(
		{
			input: {
				resize: "none", // would be nicer to have this on implementation level
			},
			readonly: {},
		},
		props
	)

	return (
		<input
			type={password ? "password" : "text"}
			value={value || ""}
			placeholder={placeholder}
			className={styles.cx(classes.input, readonly && classes.readonly)}
			disabled={readonly}
			onChange={(event) => setValue(event.target.value)}
		/>
	)
}

export default TextField
