import { FunctionComponent } from "react"
import { definition, styles, context, wire } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	setValue?: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode?: context.FieldMode
	readonly?: boolean
	placeholder?: string
	password?: boolean
	focusOnRender?: boolean
}

const TextField: FunctionComponent<TextFieldProps> = (props) => {
	const {
		setValue,
		mode,
		placeholder,
		password,
		readonly,
		id,
		focusOnRender,
	} = props
	const value = props.value as string
	const classes = styles.useUtilityStyles(
		{
			input: {
				resize: "none", // would be nicer to have this on implementation level
			},
			readonly: {},
		},
		props,
		"uesio/io.field"
	)

	return (
		<input
			id={id}
			type={password ? "password" : "text"}
			value={value || ""}
			placeholder={placeholder}
			className={styles.cx(classes.input, readonly && classes.readonly)}
			disabled={readonly || mode === "READ"}
			onChange={(event) => setValue?.(event.target.value)}
			ref={(input: HTMLInputElement) => focusOnRender && input?.focus()}
		/>
	)
}

export default TextField
