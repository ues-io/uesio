import { definition, api, wire, collection } from "@uesio/ui"
import SuggestDataButton from "../../utilities/suggestdatabutton/suggestdatabutton"

type ComponentDefinition = {
	wire: string
}

const handleResults = (wire: wire.Wire, results: wire.PlainWireRecord[]) => {
	const collection = wire.getCollection()
	const selectOrMSFields = [] as collection.Field[]
	// const referenceFields = []
	// Could use 3 filter() calls here, but it's more efficient to do a single pass over the fields array
	wire.getFields().forEach((field) => {
		const fieldMetadata = collection.getFieldMetadata(field.id)
		if (!fieldMetadata) return
		const type = fieldMetadata.getType()
		if (type === "SELECT" || type === "MULTISELECT") {
			selectOrMSFields.push(fieldMetadata)
		}
		//  else if (type === "REFERENCE") {
		// 	referenceFields.push(fieldMetadata)
		// }
	})
	results.forEach((result) => {
		wire.createRecord({
			...result,
			// Populate values for all SELECT/MULTISELECT fields
			...getSelectFieldValues(selectOrMSFields),
			// ...getReferenceFieldValue(referenceFields),
		})
	})
}

const getSelectFieldValues = (
	selectFields: collection.Field[]
): wire.PlainWireRecord => {
	if (!selectFields.length) return {}
	return Object.fromEntries(
		selectFields.map((field) => [
			field.getId(),
			getRandomSelectOptionValue(
				field.getSelectMetadata()?.options || []
			),
		])
	)
}

const getRandomSelectOptionValue = (options: wire.SelectOption[]): string =>
	options[Math.floor(Math.random() * options.length)].value

const nonAiFieldTypes = ["SELECT", "MULTISELECT", "REFERENCE", "AUTONUMBER"]

const getFieldMetadataForPrompt = (
	fields: wire.LoadRequestField[] | undefined,
	collection: collection.Collection | undefined
): string =>
	!collection || !fields?.length
		? ""
		: (fields || [])
				.filter((field) => {
					// Ignore non-createable fields, as well as fields that we will take care of later
					const fieldMetadata = collection.getFieldMetadata(field.id)
					if (!fieldMetadata) return false
					const type = fieldMetadata.getType()
					return (
						fieldMetadata.getCreateable() &&
						!nonAiFieldTypes.includes(type)
					)
				})
				// (1) type - the PostgreSQL column type (2) label - the name of the column`
				.map((field, idx) => {
					const fieldMetadata = collection.getFieldMetadata(field.id)
					return `(${idx + 1}) "${
						field.id
					}", of SQL type ${getSQLDataTypeForField(fieldMetadata)}`
				})
				.join(", ")

const getSQLDataTypeForField = (
	fieldMetadata: collection.Field | undefined
): string => {
	if (!fieldMetadata) return "text"
	const uesioType = fieldMetadata.getType()
	let decimals

	switch (uesioType) {
		case "NUMBER":
			decimals = fieldMetadata.getNumberMetadata()?.decimals || 0
			if (decimals > 0) {
				return "decimal(" + decimals + ")"
			}
			return "int"
		case "DATE":
		case "TIMESTAMP":
			return uesioType.toLowerCase()
		case "CHECKBOX":
			return "boolean"
	}
	return "varchar(100)"
}

const SuggestedWireDataButton: definition.UC<ComponentDefinition> = (props) => {
	const {
		context,
		definition: { wire: wireName },
	} = props

	const wire = api.wire.useWire(wireName, context)
	const fields = wire?.getFields()
	const collection = wire?.getCollection()
	const pluralLabel = collection?.getPluralLabel()

	const prompt = `I have a database table that stores ${pluralLabel}. I would like to generate sample data for this table. Please generate 5 sample records for this table, output as a JSON array of JSON objects, with each JSON object having the following properties: ${getFieldMetadataForPrompt(
		fields,
		collection
	)}. Please respond with valid JSON! Do not respond with any text other than valid JSON.`

	return (
		<SuggestDataButton
			context={context.deleteWorkspace()}
			prompt={prompt}
			botName="uesio/studio.suggestdata"
			label={"Generate sample data"}
			loadingLabel={"Generating data..."}
			handleResults={(results: wire.PlainWireRecord[]) => {
				if (!wire || !results.length) return
				handleResults(wire, results)
			}}
		/>
	)
}

export default SuggestedWireDataButton
