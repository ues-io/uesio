import { wire } from "@uesio/ui"
import { SelectProperty } from "../../properties/componentproperty"
import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const getSelectListMetadataFromOptions = (
	propertyName: string,
	options: wire.SelectOption[],
	blankOptionLabel?: string
) =>
	({
		name: `${propertyName}_options`,
		blank_option_label: blankOptionLabel,
		options,
	}) as wire.SelectListMetadata

const resolveOptions = (def: SelectProperty): wire.SelectOption[] => {
	const { options = [] } = def
	return options
}

const getSelectListMetadata = (def: SelectProperty) =>
	def.selectList
		? {
				name: def.selectList,
			}
		: getSelectListMetadataFromOptions(
				def.name,
				resolveOptions(def).map((o) => ({
					...o,
				})),
				def.blankOptionLabel
			)

const selectHandler: PropertyTypeHandler = {
	getField: (property: SelectProperty) =>
		getBaseWireFieldDef(property, "SELECT", {
			selectlist: getSelectListMetadata(property),
		}),
}

export {
	getSelectListMetadata,
	getSelectListMetadataFromOptions,
	selectHandler,
}
