import { api, context, wire } from "@uesio/ui"
import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"
import { getSelectListMetadataFromOptions } from "./select"
import { ComponentProperty } from "../../properties/componentproperty"

const getNamespaceSelectListMetadata = (
	context: context.Context,
	def: ComponentProperty
) => {
	const [namespaces] = api.builder.useAvailableNamespaces(context)
	return getSelectListMetadataFromOptions(
		def.name,
		namespaces?.map(
			(ns) =>
				({
					value: ns,
					label: ns,
				}) as wire.SelectOption
		) || [],
		"(Select a namespace)"
	)
}

const namespaceHandler: PropertyTypeHandler = {
	getField: (property, context) =>
		getBaseWireFieldDef(property, "SELECT", {
			selectlist: getNamespaceSelectListMetadata(context, property),
		}),
}

export { namespaceHandler }
