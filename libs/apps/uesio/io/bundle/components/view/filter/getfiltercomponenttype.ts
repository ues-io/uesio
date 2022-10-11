import { hooks, metadata } from "@uesio/ui"

export default (uesio: hooks.Uesio, wireId: string, fieldId: string) => {
	const wire = uesio.wire.useWire(wireId)
	if (!wire) return null
	const collection = wire.getCollection()
	const fieldType = collection.getField(fieldId)?.getType()

	if (!fieldType) {
		console.warn(`Error findding fieldtype filter:`, [wireId, fieldId])
	}
	const componentType = `uesio/io.filter${fieldType?.toLowerCase()}`

	return componentType as metadata.MetadataKey
}
