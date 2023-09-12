import { unlocalize } from "../../component/path"
import Field from "../field/class"
import { CollectionKey } from "../wire/types"
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
	getFullName = (): CollectionKey =>
		`${this.getNamespace()}.${this.getId()}` as CollectionKey
	getLabel = () => this.source.label
	getPluralLabel = () => this.source.pluralLabel

	// Accepts a single field
	getFieldMetadata = (fieldName: string) => {
		const fieldMetadata =
			this.source.fields[unlocalize(fieldName, this.getNamespace())]
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
			// Non-mutating equivalent of .shift()
			const [, ...restOfPath] = fieldPath
			if (baseMetadata.isReference()) {
				const referenceMetadata = baseMetadata.getReferenceMetadata()
				const collection = new Collection(
					getCollection(referenceMetadata?.collection)
				)
				return collection.getFieldFromPathArray(restOfPath)
			}
			if (!baseMetadata.getSubFields()) return undefined
			return getSubFieldMetadata(restOfPath, baseMetadata)
		}
		return baseMetadata
	}

	getField = (fieldName: string | null): Field | undefined =>
		this.getFieldFromPathArray(fieldName?.split("->"))

	getIdField = () => this.getField(ID_FIELD)
	getNameField = () => this.getField(this.source.nameField)
	getUniqueKeyFields = () =>
		this.source.uniqueKey && this.source.uniqueKey.length > 0
			? this.source.uniqueKey
					.map((f) => this.getField(f))
					.filter((fieldId) => !!fieldId)
			: [this.getIdField()]
	/**
	 * Returns an array of the fully-qualified ids of all top-level fields on the collection.
	 */
	getFieldIds = () => Object.keys(this.source.fields)
	/**
	 * Returns an array of Field objects corresponding to all top-level Fields
	 */
	getFields = () => Object.values(this.source.fields).map((v) => new Field(v))
	/**
	 * Returns an array of Field objects which are of a searchable field type
	 */
	getSearchableFields = () =>
		Object.values(this.source.fields)
			.filter((f) => searchableFieldTypes.includes(f.type))
			.map((v) => new Field(v))
}

const searchableFieldTypes = ["TEXT", "LONGTEXT", "SELECT"]

export default Collection
