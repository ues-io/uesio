import { collection } from "@uesio/ui"
import { SelectOption, DefaultBlankValue } from "./types"

const getBlankSelectOption = (val: string): SelectOption => ({
	value: DefaultBlankValue,
	label: val,
})

const addBlankSelectOption = (
	options: SelectOption[] | undefined,
	field?: collection.Field
): SelectOption[] => {
	if (field) {
		const blankOption = field.getBlankOption()
		if (blankOption) {
			return [getBlankSelectOption(blankOption)].concat(options || [])
		}
	}

	return [getBlankSelectOption("")].concat(options || [])
}

export { getBlankSelectOption, addBlankSelectOption }
