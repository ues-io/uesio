import { component, definition, api, wire, context, styles } from "@uesio/ui"
import { useEffect, useState } from "react"
import { parse } from "best-effort-json-parser"

type ComponentDefinition = {
	collectionWire: string
	fieldWire: string
}

type AutocompleteResponse = {
	choices?: string[]
	errors?: string[]
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

type CollectionFieldExtraMetadata = {
	"uesio/studio.number"?: NumberFieldMetadata
}

const parameterizedTypeRegex =
	/^(numeric|decimal|varchar|char)\((\d{1,})(,(\d{1,}))\)$/

const capitalizeFirst = (str: string) =>
	str.charAt(0).toUpperCase() + str.slice(1)

const setNumberFieldDecimals = (
	decimals: number,
	inObject: CollectionFieldExtraMetadata
) => (inObject["uesio/studio.number"] = { "uesio/studio.decimals": decimals })

export const getUesioFieldFromSuggestedField = (
	suggestedField: SuggestedField,
	collectionName: string,
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
		"uesio/studio.label": capitalizeFirst(label),
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

const handleAutocompleteData = (
	context: context.Context,
	fieldWire: wire.Wire,
	response: AutocompleteResponse,
	collectionName: string,
	workspaceId: string
) => {
	if (response.errors) {
		return
	}
	if (response.choices?.length) {
		const data = response.choices[0] as string
		try {
			const dataArray: SuggestedField[] = parse(data)
			if (dataArray?.length) {
				dataArray.forEach((val) => {
					fieldWire.createRecord(
						getUesioFieldFromSuggestedField(
							val,
							collectionName,
							workspaceId
						)
					)
				})
				// Turn the table into edit mode
				api.signal.run(
					{
						signal: "component/CALL",
						component: "uesio/io.table",
						componentsignal: "SET_EDIT_MODE",
						targettype: "specific",
						componentid: "fields",
					},
					context
				) as Promise<context.Context>
			}
		} catch (e) {
			console.error(e)
			// eslint-disable-next-line no-empty
		}
	}
}

const StyleDefaults = Object.freeze({
	root: ["animate-pulse", "place-content-center", "w-full", "mt-2"],
})

const SuggestedFields: definition.UC<ComponentDefinition> = (props) => {
	const {
		context,
		definition: {
			collectionWire: collectionWireName,
			fieldWire: fieldWireName,
		},
	} = props

	const canUseAiFeatures = !!context.getFeatureFlag("use_ai_signals")?.value
	const IOImage = component.getUtility("uesio/io.image")
	const classes = styles.useStyleTokens(StyleDefaults, props)

	const fieldWire = api.wire.useWire(
		fieldWireName || "",
		context
	) as wire.Wire
	const collectionWire = api.wire.useWire(
		collectionWireName || "",
		context
	) as wire.Wire
	const workspaceWire = api.wire.useWire("workspaces", context) as wire.Wire
	const workspaceId = workspaceWire
		?.getFirstRecord()
		?.getIdFieldValue() as string
	const targetCollection = collectionWire?.getFirstRecord()
	const pluralLabel = targetCollection?.getFieldValue(
		"uesio/studio.plurallabel"
	)
	const targetCollectionName = context.mergeString(
		(fieldWire?.getCondition("fullCollectionName") as ValueConditionState)
			.value
	)

	const prompt = `I am creating a new PostgreSQL database table to store ${pluralLabel}. Suggest 10 relevant columns for this new table, output as a JSON array of JSON objects, with each JSON object having 2 properties: (1) type - the PostgreSQL column type (2) label - the name of the column`

	const [hasRunBefore, setHasRunBefore] = useState(false)
	const [isLoading, setLoading] = useState(false)

	useEffect(() => {
		// Don't run if we already have data
		if (hasRunBefore || fieldWire?.getData().length || !canUseAiFeatures)
			return

		setLoading(true)

		const signalResult = api.signal.run(
			{
				signal: "ai/AUTOCOMPLETE",
				model: "gpt-3.5-turbo",
				format: "chat",
				input: prompt,
				stepId: "autocomplete",
				maxResults: 1,
			},
			context
		) as Promise<context.Context>

		signalResult.then((resultContext) => {
			const result = resultContext.getSignalOutputs("autocomplete")

			handleAutocompleteData(
				context,
				fieldWire,
				result.data,
				targetCollectionName,
				workspaceId
			)

			setLoading(false)
			setHasRunBefore(true)
		})

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [prompt, hasRunBefore, fieldWire?.getData().length, canUseAiFeatures])

	return isLoading ? (
		<div className={classes.root}>
			<IOImage
				file="uesio/studio.openailogo"
				width="200"
				height="205"
				context={context.removeWorkspace()}
			/>
		</div>
	) : null
}

export default SuggestedFields
