import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react"
import { FieldValueSetter, ApplyChanges } from "./../components/field/field"

const useControlledInput = <T extends HTMLInputElement | HTMLTextAreaElement>(
	value: T extends HTMLTextAreaElement ? string : number | string,
	setValue: FieldValueSetter | undefined,
	applyChanges: ApplyChanges | undefined
) => {
	const [controlledValue, setControlledValue] = useState(value)
	useEffect(() => {
		setControlledValue(value || "")
	}, [value])
	const applyOnBlur = applyChanges === "onBlur"

	return {
		value: (controlledValue as string) || "",
		onChange: (e: ChangeEvent<T>) => {
			setControlledValue(e.target.value)
			!applyOnBlur && setValue?.(e.target.value)
		},
		onBlur: (e: ChangeEvent<T>) =>
			applyOnBlur &&
			value !== e.target.value &&
			setValue?.(e.target.value),
		onKeyPress: (e: KeyboardEvent<T>) => {
			if (
				applyOnBlur &&
				e.key === "Enter" &&
				value !== e.currentTarget.value
			) {
				setValue?.(e.currentTarget.value)
			}
		},
	}
}

const useControlledInputNumber = <T extends HTMLInputElement>(
	value: string | number,
	setValue: FieldValueSetter | undefined
) => {
	const [controlledValue, setControlledValue] = useState(value)

	useEffect(() => {
		setControlledValue(value)
	}, [value])

	return {
		value:
			controlledValue === null || controlledValue === undefined
				? ""
				: controlledValue,
		onChange: (e: ChangeEvent<T>) => {
			const valueAsNumber = e.target.valueAsNumber
			const valueAsString = e.target.value
			setControlledValue(valueAsString)
			const isNumeric = !isNaN(valueAsNumber)
			isNumeric ? setValue?.(valueAsNumber) : setValue?.(null)
		},
	}
}

export { useControlledInput, useControlledInputNumber }
