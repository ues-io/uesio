import { useState } from "react"
import { definition, styles, context, wire } from "@uesio/ui"
import { FieldValueSetter, ApplyChanges } from "../../components/field/field"
import { useControlledInput } from "../../shared/useControlledFieldValue"

import Icon from "../icon/icon"

export type TextFieldOptions = {
	autoComplete?: string
}

interface TextFieldProps {
	applyChanges?: ApplyChanges
	focusOnRender?: boolean
	list?: string
	mode?: context.FieldMode
	placeholder?: string
	readonly?: boolean
	options?: TextFieldOptions
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
		focusOnRender = false,
		id,
		list,
		mode,
		options,
		placeholder,
		readonly = false,
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
	const isPassword = type === "password"
	const controlledInputProps = useControlledInput(
		value as string,
		setValue,
		applyChanges,
		isReadMode
	)

	const [useType, setType] = useState(type)

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
				autoComplete={options?.autoComplete}
				disabled={isReadMode}
				autoFocus={focusOnRender}
				{...controlledInputProps}
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
