import { SelectOption } from "./types"

const getBlankSelectOption = (): SelectOption => ({
	value: "",
	label: "",
})

const addBlankSelectOption = (
	options: SelectOption[] | undefined
): SelectOption[] => [getBlankSelectOption()].concat(options || [])

export { getBlankSelectOption, addBlankSelectOption }
