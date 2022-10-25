import { hooks, metadata } from "@uesio/ui"

export default (
	uesio: hooks.Uesio,
	wireId: string,
	fieldId: string
): metadata.MetadataKey | null => {
	const wire = uesio.wire.useWire(wireId)
	if (!wire) return null
	const collection = wire.getCollection()
	const fieldType = collection.getField(fieldId)?.getType()

	if (!fieldType) {
		console.warn(`Error findding fieldtype filter:`, [wireId, fieldId])
	}

	switch (fieldType) {
		case "NUMBER":
			return "uesio/io.filternumber"
		case "SELECT":
			return "uesio/io.filterselect"
		default:
			return null
	}
}
