import { component, definition, api, wire } from "@uesio/ui"

type ComponentDefinition = {
	collectionWire: string
	fieldWire: string
	targetTableId?: string
}

type SuggestedField = {
	label: string
	type: string
}

type ValueConditionState = {
	value: string
}

type NumberFieldMetadata = {
	"uesio/studio.decimals"?: number
}

type AutonumberFieldMetadata = {
	"uesio/studio.leadingzeros"?: number
	"uesio/studio.prefix"?: string
}

type CollectionFieldExtraMetadata = {
	"uesio/studio.number"?: NumberFieldMetadata
	"uesio/studio.autonumber"?: AutonumberFieldMetadata
}

const parameterizedTypeRegex =
	/^(numeric|decimal|varchar|char)\((\d{1,})(,(\d{1,}))\)$/

const capitalizeFirst = (str: string) =>
	str.charAt(0).toUpperCase() + str.slice(1)

const sanitizeSuggestedLabel = (str: string) =>
	capitalizeFirst(str).replace(/_/g, " ")

const setNumberFieldDecimals = (
	decimals: number,
	inObject: CollectionFieldExtraMetadata
) => (inObject["uesio/studio.number"] = { "uesio/studio.decimals": decimals })

export const getUesioFieldFromSuggestedField = (
	suggestedField: SuggestedField,
	collectionName: string,
	collectionPluralLabel: string,
	workspaceId: string
) => {
	const { type, label } = suggestedField

	// const length: number | undefined = undefined
	let uesioType = "TEXT"
	const sqlType = type.toLocaleLowerCase()
	const extras: CollectionFieldExtraMetadata = {}
	const partMatches = sqlType.match(parameterizedTypeRegex)

	if (sqlType.includes("int")) {
		uesioType = "NUMBER"
		setNumberFieldDecimals(0, extras)
	} else if (sqlType.startsWith("numeric") || sqlType.startsWith("decimal")) {
		uesioType = "NUMBER"
		if (partMatches?.length === 5 && partMatches[4] !== undefined) {
			setNumberFieldDecimals(parseInt(partMatches[4], 10), extras)
		}
	} else if (sqlType.includes("serial")) {
		uesioType = "AUTONUMBER"
		extras["uesio/studio.autonumber"] = {
			"uesio/studio.prefix": collectionPluralLabel
				.toUpperCase()
				.substring(0, 2),
			"uesio/studio.leadingzeros": 4,
		}
	} else if (sqlType.includes("boolean")) {
		uesioType = "CHECKBOX"
	} else if (sqlType.includes("timestamp")) {
		uesioType = "TIMESTAMP"
	} else if (sqlType.includes("date")) {
		uesioType = "DATE"
	}

	return {
		"uesio/studio.name": getUesioFieldNameFromLabel(label),
		"uesio/studio.type": uesioType,
		"uesio/studio.label": sanitizeSuggestedLabel(label),
		// "uesio/studio.length": length,
		"uesio/studio.collection": collectionName,
		"uesio/studio.workspace": {
			"uesio/core.id": workspaceId,
		},
		...extras,
	}
}

const getUesioFieldNameFromLabel = (label: string) =>
	label.toLowerCase().replace(/[^a-z0-9]/g, "_") as string

const handleResults = (
	collectionName: string,
	collectionPluralLabel: string,
	workspaceId: string,
	suggestedFields: SuggestedField[],
	fieldWire?: wire.Wire
) => {
	if (!fieldWire) return
	suggestedFields.forEach((val) => {
		// We need at least label and type to do anything useful
		if (val && val.label && val.type) {
			fieldWire.createRecord(
				getUesioFieldFromSuggestedField(
					val,
					collectionName,
					collectionPluralLabel,
					workspaceId
				)
			)
		}
	})
}

const SuggestedFields: definition.UC<ComponentDefinition> = (props) => {
	const {
		context,
		definition: {
			collectionWire: collectionWireName,
			fieldWire: fieldWireName,
			targetTableId,
		},
	} = props

	const SuggestDataButton = component.getUtility(
		"uesio/studio.suggestdatabutton"
	)

	const fieldWire = api.wire.useWire(fieldWireName || "", context)
	const collectionWire = api.wire.useWire(collectionWireName || "", context)
	const workspaceWire = api.wire.useWire("workspaces", context)
	const workspaceId = workspaceWire
		?.getFirstRecord()
		?.getIdFieldValue() as string
	const targetCollection = collectionWire?.getFirstRecord()
	const pluralLabel = (targetCollection?.getFieldValue(
		"uesio/studio.plurallabel"
	) || "") as string
	const targetCollectionName = context.mergeString(
		(fieldWire?.getCondition("fullCollectionName") as ValueConditionState)
			.value
	)
	return (
		<SuggestDataButton
			context={context}
			prompt={`I am creating a new PostgreSQL database table to store ${pluralLabel}. Suggest 10 relevant columns for this new table, output as a JSON array of JSON objects, with each JSON object having 2 properties: (1) type - the PostgreSQL column type (2) label - the name of the column`}
			label={"Suggest Fields"}
			loadingLabel={"Suggesting fields..."}
			targetTableId={targetTableId}
			handleResults={(results: SuggestedField[]) => {
				handleResults(
					targetCollectionName,
					pluralLabel,
					workspaceId,
					results,
					fieldWire
				)
			}}
		/>
	)
}

export default SuggestedFields
