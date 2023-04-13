import { api, context, wire } from "@uesio/ui"
import { get } from "./defapi"
import { FullPath } from "./path"

const getAvailableWireIds = (context: context.Context) =>
	Object.keys(getAvailableWires(context))

const getAvailableWires = (context: context.Context) => {
	const result = get(
		context,
		new FullPath("viewdef", context.getViewDefId(), '["wires"]')
	) as wire.WireDefinitionMap
	return result
}

const getWireDefinition = (context: context.Context, wireId: string) =>
	getAvailableWires(context)?.[wireId]

const getFieldMetadata = (
	context: context.Context,
	wireId: string,
	fieldId: string
) => {
	const wireCollection = get(
		context,
		new FullPath(
			"viewdef",
			context.getViewDefId(),
			`["wires"]["${wireId}"]["collection"]`
		)
	) as string
	const collection = api.collection.useCollection(context, wireCollection)
	if (!collection) return
	return collection.getField(fieldId)
}

export {
	getAvailableWireIds,
	getAvailableWires,
	getFieldMetadata,
	getWireDefinition,
}
