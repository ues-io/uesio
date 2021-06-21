import { collection } from "@uesio/ui"
import { useEffect, useState } from "react"

export const useSelect = (
	initialValue: string,
	onChange: (value: string) => void,
	options: collection.SelectOption[] | null
): [string, React.Dispatch<React.SetStateAction<string>>] => {
	const [value, setValue] = useState(initialValue)

	// if there is no option selected and there is only 1 available, set it
	useEffect(() => {
		if (options && options.length === 1 && !value)
			setValue(options[0].value)
	}, [options, value])

	const requestUpdate = (newVal: string) => {
		if (newVal !== value) setValue(newVal)
	}

	useEffect(() => {
		onChange(value)
	}, [value, initialValue])

	return [value, requestUpdate]
}

export default useSelect
