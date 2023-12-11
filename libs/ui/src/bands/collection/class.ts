import { parseKey } from "../../component/path"
import Field from "../field/class"
import { FieldMetadataMap } from "../field/types"
import { CollectionKey } from "../wire/types"
import { getCollection } from "./selectors"

import { ID_FIELD, PlainCollection } from "./types"

const isLocalNamespace = (ns: string, localNamespace: string) =>
	ns === localNamespace || ns === "this/app"

const getFullyQualifiedKey = (
	key: string,
	defaultNamespace: string | undefined
) => {
	if (!key) return ""
	if (!defaultNamespace) return key
	const [first, second] = parseKey(key)
	if (!second) return defaultNamespace + "." + first
	if (isLocalNamespace(first, defaultNamespace))
		return defaultNamespace + "." + second
	return key
}

const getBaseField = (
	fields: FieldMetadataMap | undefined,
	fieldPath: string[],
	defaultNamespace: string
) => {
	// First, look for the fully qualified field
	const fullyQualified = getFullyQualifiedKey(fieldPath[0], defaultNamespace)
	const fieldMetadata = fields?.[fullyQualified]
	if (fieldMetadata) return new Field(fieldMetadata)
	// For ui-only fields on regular server wires,
	// we have to fallback to the non-qualified key
	const viewOnlyFieldMetadata = fields?.[fieldPath[0]]
	if (viewOnlyFieldMetadata) return new Field(viewOnlyFieldMetadata)
	// Sometimes we want a field that has no metadata
	// For example: the recordData context
	return new Field({
		createable: false,
		accessible: true,
		updateable: false,
		type: "TEXT",
		label: "",
		name: fieldPath[0],
		namespace: "",
	})
}

const getFieldFromPathArray = (
	fields: FieldMetadataMap | undefined,
	fieldPath: string[] | undefined,
	defaultNamespace: string
): Field | undefined =>
	getFieldsFromPathArray([], fields, fieldPath, defaultNamespace).pop()

const getFieldsFromPathArray = (
	returnFields: Field[],
	availableFields: FieldMetadataMap | undefined,
	fieldPath: string[] | undefined,
	defaultNamespace: string
): Field[] => {
	if (!fieldPath) return returnFields
	const baseMetadata = getBaseField(
		availableFields,
		fieldPath,
		defaultNamespace
	)
	if (fieldPath.length > 1) {
		// Non-mutating equivalent of .shift()
		const [, ...restOfPath] = fieldPath
		if (baseMetadata.isReference()) {
			const referenceMetadata = baseMetadata.getReferenceMetadata()
			const collection = getCollection(referenceMetadata?.collection)

			return getFieldsFromPathArray(
				returnFields.concat(baseMetadata),
				collection?.fields,
				restOfPath,
				collection?.namespace || ""
			)
		}
		return getFieldsFromPathArray(
			returnFields.concat(baseMetadata),
			baseMetadata.getSubFields(),
			restOfPath,
			""
		)
	}
	return returnFields.concat(baseMetadata)
}

const getFieldParts = (fieldName: string | null, collection: Collection) =>
	getFieldsFromPathArray(
		[],
		collection?.source.fields || {},
		fieldName?.split("->"),
		collection?.getNamespace() || ""
	).map((field) => {
		const ns = field.getNamespace()
		return ns ? field.getId() : field.getName()
	})

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

	// Just an alias of getField now
	getFieldMetadata = (fieldName: string) => this.getField(fieldName)

	getField = (fieldName: string | null): Field | undefined =>
		getFieldFromPathArray(
			this.source.fields,
			fieldName?.split("->"),
			this.getNamespace()
		)
	getFieldParts = (fieldName: string | null) => getFieldParts(fieldName, this)
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
	hasAllFields = () => this.source.hasAllFields
}

const searchableFieldTypes = ["TEXT", "LONGTEXT", "SELECT"]

export { getFieldParts, getFullyQualifiedKey }

export default Collection
