import Field from "../field/class"
import { getCollection } from "./selectors"

import { ID_FIELD, PlainCollection } from "./types"

function getSubFieldMetadata(
	fieldNameParts: string[],
	subfield: Field
): Field | undefined {
	const subFieldName = fieldNameParts.shift()
	if (!subFieldName) return undefined
	const found = subfield?.getSubFields()?.[subFieldName]
	if (!found) return undefined
	if (fieldNameParts.length === 0) {
		return new Field(found)
	}
	return getSubFieldMetadata(fieldNameParts, new Field(found))
}

class Collection {
	constructor(source?: PlainCollection) {
		this.source = source || ({} as PlainCollection)
	}

	source: PlainCollection

	getId = () => this.source.name
	getNamespace = () => this.source.namespace
	getFullName = () => this.getNamespace() + "." + this.getId()

	// Accepts a single field
	getFieldMetadata = (fieldName: string) => {
		const fieldMetadata = this.source.fields[fieldName]
		if (!fieldMetadata) return undefined
		return new Field(fieldMetadata)
	}

	getBaseField = (fieldPath: string[] | undefined) => {
		if (!fieldPath || fieldPath.length === 0) return undefined
		return this.getFieldMetadata(fieldPath[0])
	}

	getFieldFromPathArray = (
		fieldPath: string[] | undefined
	): Field | undefined => {
		const baseMetadata = this.getBaseField(fieldPath)
		if (!fieldPath || !baseMetadata) return undefined
		if (fieldPath.length > 1) {
			fieldPath.shift()
			if (baseMetadata.isReference()) {
				const referenceMetadata = baseMetadata.getReferenceMetadata()
				const collection = new Collection(
					getCollection(referenceMetadata?.collection)
				)
				return collection.getFieldFromPathArray(fieldPath)
			}
			if (!baseMetadata.getSubFields()) return undefined
			return getSubFieldMetadata(fieldPath, baseMetadata)
		}
		return baseMetadata
	}

	getField = (fieldName: string | null): Field | undefined =>
		this.getFieldFromPathArray(fieldName?.split("->"))

	getIdField = () => this.getField(ID_FIELD)
	getNameField = () => this.getField(this.source.nameField)
}

export default Collection
