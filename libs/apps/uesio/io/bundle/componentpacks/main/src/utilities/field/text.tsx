import { useEffect, useState } from "react"
import { definition, styles, context, wire } from "@uesio/ui"
import { FieldValueSetter, ApplyChanges } from "../../components/field/field"
import Icon from "../icon/icon"

interface TextFieldProps {
	applyChanges?: ApplyChanges
	focusOnRender?: boolean
	list?: string
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
	wrapper: ["relative"],
	toggle: [
		"absolute",
		"right-0",
		"top-0",
		"bottom-0",
		"leading-none",
		"text-slate-700",
		"m-2",
		"px-1",
	],
	password: ["pr-8"],
})

const TextField: definition.UtilityComponent<TextFieldProps> = (props) => {
	const {
		applyChanges,
		context,
		focusOnRender,
		id,
		list,
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
		setControlledValue(value || "")
	}, [value])

	return (
		<div className={classes.wrapper}>
			<input
				id={id}
				type={useType}
				list={list}
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
				value={(controlledValue as string) || ""}
				onChange={(e) => {
					setControlledValue(e.target.value)
					!applyOnBlur && setValue?.(e.target.value)
				}}
				onBlur={(e) =>
					applyOnBlur &&
					value !== e.target.value &&
					setValue?.(e.target.value)
				}
				onKeyPress={(e) => {
					if (
						applyOnBlur &&
						e.key === "Enter" &&
						value !== e.currentTarget.value
					) {
						setValue?.(e.currentTarget.value)
					}
				}}
			/>
			{isPassword && (
				<button
					className={classes.toggle}
					title={
						useType === "password"
							? "Show password"
							: "Hide password"
					}
					onClick={() =>
						setType(useType === "password" ? "text" : "password")
					}
					tabIndex={0}
				>
					<Icon
						icon={
							useType === "password"
								? "visibility"
								: "visibility_off"
						}
						context={context}
					/>
				</button>
			)}
		</div>
	)
}

export default TextField
