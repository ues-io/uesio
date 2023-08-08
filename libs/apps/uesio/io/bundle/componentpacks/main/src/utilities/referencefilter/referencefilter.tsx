import { definition, api, wire, collection } from "@uesio/ui"
import ReferenceField, { ReferenceFieldOptions } from "../field/reference"
import { ReferenceFilterOptions } from "../../components/filter/filter"

interface ReferenceFilterProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
	options?: ReferenceFilterOptions
}
const getReturnFields = (
	displayTemplate: string | undefined,
	returnFields: string[] = [],
	searchFields: string[] = []
) => {
	const pattern = /\${(.*?)}/g
	const extractedFields = displayTemplate
		? displayTemplate.match(pattern)
		: null
	const uniqueFields = new Set<string>()
	const allFields = [...(returnFields || []), ...(searchFields || [])]

	if (extractedFields) {
		for (const item of extractedFields) {
			const dynamicValue = item.slice(2, -1)
			allFields.push(dynamicValue)
		}
	}

	for (const item of allFields) {
		uniqueFields.add(item)
	}

	const fields: string[] = Array.from(uniqueFields)

	return fields.length ? fields : undefined
}

const ReferenceFilter: definition.UtilityComponent<ReferenceFilterProps> = (
	props
) => {
	const { wire, fieldMetadata, context, condition, path, options } = props
	const wireId = wire.getId()
	const referenceOptions = {
		template: options?.displayTemplate,
		returnFields: getReturnFields(
			options?.displayTemplate,
			options?.returnFields,
			options?.searchFields
		),
		searchFields: options?.searchFields,
		conditions: options?.filterConditions,
		order: options?.order,
	} as ReferenceFieldOptions
	return (
		<ReferenceField
			path={path}
			mode={"EDIT"}
			fieldId={fieldMetadata.getId()}
			fieldMetadata={fieldMetadata}
			context={context}
			variant={"uesio/io.filter"}
			options={referenceOptions}
			setValue={(value: wire.PlainWireRecord) => {
				api.signal.runMany(
					[
						{
							signal: "wire/SET_CONDITION",
							wire: wireId,
							condition: {
								...condition,
								value: value
									? value[collection.ID_FIELD]
									: null,
								inactive: value === null,
							},
						},
						{
							signal: "wire/LOAD",
							wires: [wireId],
						},
					],
					context
				)
			}}
		/>
	)
}

export default ReferenceFilter
