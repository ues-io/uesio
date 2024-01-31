import debounce from "lodash/debounce"
import {
	ChangeEvent,
	KeyboardEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react"
import { FieldValueSetter, ApplyChanges } from "./../components/field/field"

export type UseControlledInputOptions<
	T extends HTMLInputElement | HTMLTextAreaElement,
> = {
	value: T extends HTMLTextAreaElement ? string : number | string
	setValue?: FieldValueSetter
	applyChanges?: ApplyChanges
	// if applyChanges is set to "onTypingComplete", this is the number of milliseconds
	// after the last keypress before setValue is invoked with the last value
	applyDelay?: number
	readOnly?: boolean
}

const useControlledInput = <T extends HTMLInputElement | HTMLTextAreaElement>(
	options: UseControlledInputOptions<T>
) => {
	const {
		value,
		setValue,
		applyChanges,
		applyDelay = 300,
		readOnly = false,
	} = options
	const [controlledValue, setControlledValue] = useState(value)
	useEffect(() => {
		setControlledValue(value || "")
	}, [value])
	const debouncedSetValue = useMemo(
		() => debounce((newValue: string) => setValue?.(newValue), applyDelay),
		[applyDelay, setValue]
	)
	useEffect(
		() => () => {
			debouncedSetValue.cancel()
		},
		[debouncedSetValue]
	)
	const applyDebounce = applyChanges === "onTypingComplete"
	const applyOnBlur = applyChanges === "onBlur"
	return readOnly
		? {
				value: (controlledValue as string) || "",
			}
		: {
				value: (controlledValue as string) || "",
				onChange: (e: ChangeEvent<T>) => {
					setControlledValue(e.target.value)
					if (applyDebounce) {
						debouncedSetValue(e.target.value)
					} else if (!applyOnBlur) {
						setValue?.(e.target.value)
					}
				},
				onBlur: (e: ChangeEvent<T>) =>
					(applyOnBlur || applyDebounce) &&
					value !== e.target.value &&
					setValue?.(e.target.value),
				onKeyPress: (e: KeyboardEvent<T>) => {
					if (
						(applyOnBlur || applyDebounce) &&
						e.key === "Enter" &&
						value !== e.currentTarget.value
					) {
						setValue?.(e.currentTarget.value)
					}
				},
			}
}

const useControlledInputNumber = <T extends HTMLInputElement>(
	options: UseControlledInputOptions<T>
) => {
	const { value, setValue, applyChanges, applyDelay = 300 } = options
	const [controlledValue, setControlledValue] = useState(value)
	const applyOnBlur = applyChanges === "onBlur"
	const applyDebounce = applyChanges === "onTypingComplete"
	const invokeSetValue = useCallback(
		(valueAsNumber: number) => {
			if (!setValue) return
			const isNumeric = !isNaN(valueAsNumber)
			isNumeric ? setValue?.(valueAsNumber) : setValue?.(null)
		},
		[setValue]
	)
	useEffect(() => {
		setControlledValue(value)
	}, [value])
	const debouncedSetValue = useMemo(
		() =>
			debounce(
				(newValue: number) => invokeSetValue(newValue),
				applyDelay
			),
		[applyDelay, invokeSetValue]
	)
	useEffect(
		() => () => {
			debouncedSetValue.cancel()
		},
		[debouncedSetValue]
	)

	return {
		value: controlledValue ?? "",
		onChange: (e: ChangeEvent<T>) => {
			setControlledValue(e.target.value)
			if (applyDebounce) {
				debouncedSetValue(e.target.valueAsNumber)
			} else if (!applyOnBlur) {
				invokeSetValue(e.target.valueAsNumber)
			}
		},
		onBlur: (e: ChangeEvent<T>) => {
			if ((applyOnBlur || applyDebounce) && value !== e.target.value) {
				debouncedSetValue.cancel()
				invokeSetValue(e.target.valueAsNumber)
			}
		},
		onKeyPress: (e: KeyboardEvent<T>) => {
			if (
				(applyOnBlur || applyDebounce) &&
				e.key === "Enter" &&
				value !== e.currentTarget.value
			) {
				debouncedSetValue.cancel()
				invokeSetValue(e.currentTarget.valueAsNumber)
			}
		},
	}
}

export { useControlledInput, useControlledInputNumber }
