import { definition, api, wire, collection } from "@uesio/ui"
import ReferenceField, { ReferenceFieldOptions } from "../field/reference"

interface ReferenceFilterProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
	options?: ReferenceFieldOptions
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

	const fields = Array.from(
		new Set<string>(
			returnFields.concat(
				searchFields,
				extractedFields
					? extractedFields.map((f) => f.slice(2, -1))
					: []
			)
		)
	)

	return fields.length ? fields : undefined
}

const ReferenceFilter: definition.UtilityComponent<ReferenceFilterProps> = (
	props
) => {
	const { wire, fieldMetadata, context, condition, path, options } = props
	const wireId = wire.getId()
	const referenceOptions = {
		template: options?.template,
		returnFields: getReturnFields(
			options?.template,
			options?.returnFields,
			options?.searchFields
		),
		searchFields: options?.searchFields,
		conditions: options?.conditions,
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
