import { useEffect, useState } from "react"
import { definition, styles, context, wire } from "@uesio/ui"
import { FieldValueSetter, ApplyChanges } from "../../components/field/field"
import Icon from "../icon/icon"

interface TextFieldProps {
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
	input: ["grow"],
	readonly: [],
	wrapper: ["flex", "relative"],
	toggle: ["absolute", "right-3", "top-1"],
	password: ["pr-8"],
})

const TextField: definition.UtilityComponent<TextFieldProps> = (props) => {
	const {
		applyChanges,
		context,
		focusOnRender,
		id,
		mode,
		placeholder,
		readonly,
		setValue,
		type = "text",
		value = "",
	} = props

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	const isReadMode = readonly || mode === "READ"
	const applyOnBlur = applyChanges === "onBlur"
	const isPassword = type === "password"

	const [controlledValue, setControlledValue] = useState(value)
	const [useType, setType] = useState(type)

	useEffect(() => {
		setControlledValue(value)
	}, [value])

	return (
		<div className={styles.cx(classes.wrapper)}>
			<input
				id={id}
				type={useType}
				placeholder={placeholder}
				className={styles.cx(
					classes.input,
					isReadMode && classes.readonly,
					isPassword && classes.password
				)}
				disabled={isReadMode}
				ref={(input: HTMLInputElement) =>
					focusOnRender && input?.focus()
				}
				value={controlledValue as string}
				onChange={(e) => {
					setControlledValue(e.target.value)
					!applyOnBlur && setValue?.(e.target.value)
				}}
				onBlur={(e) => applyOnBlur && setValue?.(e.target.value)}
			/>
			{isPassword && (
				<button
					className={styles.cx(classes.toggle)}
					title="Show/hide password"
					onClick={() =>
						setType(useType === "password" ? "text" : "password")
					}
					tabIndex={0}
				>
					<Icon icon={"remove_red_eye"} context={context} />
				</button>
			)}
		</div>
	)
}

export default TextField
