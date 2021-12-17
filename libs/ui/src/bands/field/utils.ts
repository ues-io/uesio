import { SelectOption } from "./types"

const addBlankSelectOption = (
	options: SelectOption[] | undefined,
	blankOptionLabel?: string
): SelectOption[] =>
	[
		{
			value: "",
			label: blankOptionLabel || "",
		},
	].concat(options || [])

export { addBlankSelectOption }
