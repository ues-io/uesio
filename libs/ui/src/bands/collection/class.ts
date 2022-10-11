import { getCurrentState } from "../../store/store"
import Field from "../field/class"
import { FieldMetadata } from "../field/types"

import { ID_FIELD, PlainCollection } from "./types"

function getSubFieldMetadata(
	fieldNameParts: string[],
	subfield: FieldMetadata
): FieldMetadata | undefined {
	const subFieldName = fieldNameParts.shift()
	if (!subFieldName) return undefined
	const found = subfield?.subfields?.[subFieldName]
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
	getField = (fieldName: string | null): Field | undefined => {
		// Special handling for maps
		const fieldNameParts = fieldName?.split("->")
		if (!fieldNameParts) return undefined
		if (fieldNameParts.length > 1) {
			// Get the metadata for the base field
			const baseFieldMetadata =
				this.source.fields[fieldNameParts.shift() || ""]

			if (
				baseFieldMetadata.type === "REFERENCE" ||
				baseFieldMetadata.type === "FILE" ||
				baseFieldMetadata.type === "USER"
			) {
				if (!baseFieldMetadata.reference?.collection) return undefined
				const state =
					getCurrentState().collection.entities[
						baseFieldMetadata.reference?.collection
					]

				if (!state) return undefined
				const collection = new Collection(state)
				return collection.getField(fieldNameParts.join("->"))
			}

			if (!baseFieldMetadata || !baseFieldMetadata.subfields)
				return undefined
			const subFieldMetadata = getSubFieldMetadata(
				fieldNameParts,
				baseFieldMetadata
			)
			if (!subFieldMetadata) return undefined
			return new Field(subFieldMetadata)
		}
		const fieldMetadata = fieldName ? this.source.fields[fieldName] : null
		if (!fieldMetadata) return undefined
		return new Field(fieldMetadata)
	}

	getIdField = () => this.getField(ID_FIELD)
	getNameField = () => this.getField(this.source.nameField)
}

export default Collection
