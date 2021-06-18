import { useEffect, useState } from "react"

export const useSelect = (
	initialValue: string,
	onChange: (value: string) => void
): [string, React.Dispatch<React.SetStateAction<string>>] => {
	const [value, setValue] = useState(initialValue)

	useEffect(() => {
		onChange(value)
	}, [value])

	return [value, setValue]
}

export default useSelect
