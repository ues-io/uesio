import { FC, useEffect, useState } from "react"
import { definition, styles, context, wire } from "@uesio/ui"
import { FieldValueSetter, ApplyChanges } from "../../components/field/field"

interface TextFieldProps extends definition.UtilityProps {
	applyChanges?: ApplyChanges
	focusOnRender?: boolean
	mode?: context.FieldMode
	placeholder?: string
	readonly?: boolean
	setValue?: FieldValueSetter
	type?: "search" | "password" | "text" | "email" | "tel" | "url"
	value?: wire.FieldValue
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const TextField: FC<TextFieldProps> = (props) => {
	const {
		applyChanges,
		focusOnRender,
		id,
		mode,
		placeholder,
		readonly,
		setValue,
		type = "text",
	} = props

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	const isReadMode = readonly || mode === "READ"
	const applyOnBlur = applyChanges === "onBlur"

	const [value, setControlledValue] = useState(props.value || "")

	useEffect(() => {
		setControlledValue(props.value || "")
	}, [props.value])

	return (
		<input
			id={id}
			type={type}
			placeholder={placeholder}
			className={styles.cx(classes.input, isReadMode && classes.readonly)}
			disabled={isReadMode}
			ref={(input: HTMLInputElement) => focusOnRender && input?.focus()}
			value={value as string}
			onChange={(e) => {
				setControlledValue(e.target.value)
				!applyOnBlur && setValue?.(e.target.value)
			}}
			onBlur={(e) => applyOnBlur && setValue?.(e.target.value)}
		/>
	)
}

export default TextField
