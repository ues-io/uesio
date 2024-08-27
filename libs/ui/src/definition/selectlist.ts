import { DisplayCondition } from "../component/display"
import { Keyable } from "../metadata/types"

type SelectListMetadata = {
	options?: SelectOption[]
	blank_option_label?: string
	blank_option_language_label?: string
} & Keyable

type SelectListMetadataMap = {
	[key: string]: SelectListMetadata
}

type SelectOption = {
	label: string
	value: string
	languageLabel?: string
	disabled?: boolean
	// Title is used for acccessibility, it renders as a tooltip
	// if you hover over a SelectOption for long enough
	title?: string
	validFor?: DisplayCondition[]
	// if a SelectOption has childs then it will be a optgroup
	options?: SelectOption[] | null
}

export type { SelectListMetadata, SelectOption, SelectListMetadataMap }
