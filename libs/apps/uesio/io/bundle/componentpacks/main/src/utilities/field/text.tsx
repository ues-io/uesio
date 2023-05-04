import React, { FC, useState } from "react"
import { definition, styles, context, wire } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	setValue?: (value: wire.FieldValue) => void
	value?: wire.FieldValue
	mode?: context.FieldMode
	readonly?: boolean
	placeholder?: string
	type?: "search" | "password" | "text" | "email" | "tel" | "url"
	focusOnRender?: boolean
	updateOnBlur?: boolean
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const useUpdate = (
	delayUntilBlur: boolean,
	setValue: ((value: wire.FieldValue) => void) | undefined,
	initialValue: string
): {
	onChange: React.ChangeEventHandler<HTMLInputElement>
	onBlur: React.FocusEventHandler<HTMLInputElement>
	currentValue: string
} => {
	const [currentValue, setCurrentValue] = useState(initialValue)
	return {
		onChange: (e) =>
			delayUntilBlur
				? setCurrentValue?.(e.target.value)
				: setValue?.(e.target.value),
		onBlur: () =>
			delayUntilBlur && currentValue !== initialValue
				? setValue?.(currentValue)
				: null,
		currentValue,
	}
}

const TextField: FC<TextFieldProps> = (props) => {
	const {
		setValue,
		mode,
		placeholder,
		type = "text",
		readonly,
		updateOnBlur = false,
		id,
		focusOnRender,
	} = props

	const updateProps = useUpdate(
		updateOnBlur,
		setValue,
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
			placeholder={placeholder}
			className={styles.cx(classes.input, isReadMode && classes.readonly)}
			disabled={isReadMode}
			ref={(input: HTMLInputElement) => focusOnRender && input?.focus()}
			{...updateProps}
		/>
	)
}

export default TextField
