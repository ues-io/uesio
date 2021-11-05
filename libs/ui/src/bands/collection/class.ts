import Field from "../field/class"
import { SubField } from "../field/types"
import { PlainCollection } from "./types"

function getSubFieldMetadata(
	fieldNameParts: string[],
	subfield: SubField
): SubField | undefined {
	const subFieldName = fieldNameParts.shift()
	const found = subfield?.subfields?.find(
		(field) => field.name === subFieldName
	)
	if (!found) return undefined
	if (fieldNameParts.length === 0) {
		return found
	}
	return getSubFieldMetadata(fieldNameParts, found)
}

class Collection {
	constructor(source: PlainCollection) {
		this.source = source
	}

	source: PlainCollection

	getId = () => this.source.name
	getNamespace = () => this.source.namespace
	getFullName = () => this.getNamespace() + "." + this.getId()
	getField = (fieldName: string | null) => {
		// Special handling for maps
		const fieldNameParts = fieldName?.split("->")
		if (!fieldNameParts) return undefined
		if (fieldNameParts.length > 1) {
			// Get the metadata for the base field
			const baseFieldMetadata =
				this.source.fields[fieldNameParts.shift() || ""]

			console.log("baseFieldMetadata", baseFieldMetadata)

			if (!baseFieldMetadata || !baseFieldMetadata.subfields)
				return undefined
			const subFieldMetadata = getSubFieldMetadata(fieldNameParts, {
				name: baseFieldMetadata.name,
				label: baseFieldMetadata.label,
				type: baseFieldMetadata.type,
				subfields: baseFieldMetadata.subfields,
				selectlist: baseFieldMetadata.selectlist,
			})
			if (!subFieldMetadata) return undefined
			return new Field({
				namespace: baseFieldMetadata.namespace,
				accessible: baseFieldMetadata.accessible,
				createable: baseFieldMetadata.createable,
				updateable: baseFieldMetadata.updateable,
				...subFieldMetadata,
			})
		}
		const fieldMetadata = fieldName ? this.source.fields[fieldName] : null
		if (!fieldMetadata) return undefined
		return new Field(fieldMetadata)
	}

	getIdField = () => this.getField(this.source.idField)
	getNameField = () => this.getField(this.source.nameField)
}

export default Collection
