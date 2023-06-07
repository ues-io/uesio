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

export default useControlledInput
