import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react"
import { FieldValueSetter, ApplyChanges } from "./../components/field/field"

const useControlledInput = <T extends HTMLInputElement | HTMLTextAreaElement>(
	value: T extends HTMLTextAreaElement ? string : number | string,
	setValue: FieldValueSetter | undefined,
	applyChanges: ApplyChanges | undefined,
	readonly: boolean
) => {
	const [controlledValue, setControlledValue] = useState(value)
	useEffect(() => {
		setControlledValue(value || "")
	}, [value])
	const applyOnBlur = applyChanges === "onBlur"

	return {
		value: (controlledValue as string) || "",
		onChange: (e: ChangeEvent<T>) => {
			if (!readonly) {
				setControlledValue(e.target.value)
				!applyOnBlur && setValue?.(e.target.value)
			}
		},
		onBlur: (e: ChangeEvent<T>) =>
			!readonly &&
			applyOnBlur &&
			value !== e.target.value &&
			setValue?.(e.target.value),
		onKeyPress: (e: KeyboardEvent<T>) => {
			if (
				!readonly &&
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
	setValue: FieldValueSetter | undefined,
	applyChanges: ApplyChanges | undefined
) => {
	const [controlledValue, setControlledValue] = useState(value)
	const applyOnBlur = applyChanges === "onBlur"
	const invokeSetValue = (valueAsNumber: number) => {
		if (!setValue) return
		const isNumeric = !isNaN(valueAsNumber)
		isNumeric ? setValue?.(valueAsNumber) : setValue?.(null)
	}

	useEffect(() => {
		setControlledValue(value)
	}, [value])

	return {
		value:
			controlledValue === null || controlledValue === undefined
				? ""
				: controlledValue,
		onChange: (e: ChangeEvent<T>) => {
			setControlledValue(e.target.value)
			!applyOnBlur && invokeSetValue(e.target.valueAsNumber)
		},
		onBlur: (e: ChangeEvent<T>) =>
			applyOnBlur &&
			value !== e.target.value &&
			invokeSetValue(e.target.valueAsNumber),
		onKeyPress: (e: KeyboardEvent<T>) => {
			if (
				applyOnBlur &&
				e.key === "Enter" &&
				value !== e.currentTarget.value
			) {
				invokeSetValue(e.currentTarget.valueAsNumber)
			}
		},
	}
}

export { useControlledInput, useControlledInputNumber }
