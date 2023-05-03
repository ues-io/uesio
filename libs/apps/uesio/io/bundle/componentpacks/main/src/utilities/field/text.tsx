import { FunctionComponent, useState } from "react"
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
	input: [],
	readonly: [],
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
	const [currentValue, setCurrentValue] = useState<string>(
		`${props.value || ""}`
	)

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	const isReadMode = readonly || mode === "READ"

	return (
		<input
			id={id}
			type={type}
			value={currentValue || ""}
			onBlur={({ target: { value } }) =>
				value !== props.value ? setValue?.(value) : null
			}
			placeholder={placeholder}
			className={styles.cx(classes.input, isReadMode && classes.readonly)}
			disabled={isReadMode}
			onChange={(event) => setCurrentValue(event.target.value)}
			ref={(input: HTMLInputElement) => focusOnRender && input?.focus()}
		/>
	)
}

export default TextField
