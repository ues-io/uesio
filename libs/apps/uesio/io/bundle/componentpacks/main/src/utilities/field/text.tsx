import { FunctionComponent } from "react"
import { definition, styles, context, wire } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	setValue?: (value: wire.FieldValue) => void
	value?: wire.FieldValue
	mode?: context.FieldMode
	readonly?: boolean
	placeholder?: string
	type?: "search" | "password" | "text" | "email" | "tel" | "url"
	focusOnRender?: boolean
}

const StyleDefaults = Object.freeze({
	input: {},
	readonly: {},
})

const TextField: FunctionComponent<TextFieldProps> = (props) => {
	const {
		setValue,
		mode,
		placeholder,
		type = "text",
		readonly,
		id,
		focusOnRender,
	} = props
	const value = props.value as string
	const classes = styles.useUtilityStyles(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	const isReadMode = readonly || mode === "READ"

	return (
		<input
			id={id}
			type={type}
			value={value || ""}
			placeholder={placeholder}
			className={styles.cx(classes.input, isReadMode && classes.readonly)}
			disabled={isReadMode}
			onChange={(event) => setValue?.(event.target.value)}
			ref={(input: HTMLInputElement) => focusOnRender && input?.focus()}
		/>
	)
}

export default TextField
