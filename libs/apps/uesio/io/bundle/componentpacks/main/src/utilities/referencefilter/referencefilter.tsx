import { definition, api, wire, collection } from "@uesio/ui"
import ReferenceField, { ReferenceFieldOptions } from "../field/reference"

interface ReferenceFilterProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
	options?: ReferenceFieldOptions
	displayTemplate?: string
	filterConditions?: wire.WireConditionState[]
	returnFields?: string[]
	searchFields?: string[]
	order?: wire.OrderState[]
}
const getReturnFields = (
	displayTemplate: string | undefined,
	returnFields = []
	searchFields = []
) => {
	const pattern = /\${(.*?)}/g
	const extractedFields = displayTemplate
		? displayTemplate.match(pattern)
		: null
	const fields = Array.from(new Set<string>(
	   returnFields.concat(searchFields, extractedFields.map((f) => f.slice(2, -1))
	))

	return fields.length ? fields : undefined
}

const ReferenceFilter: definition.UtilityComponent<ReferenceFilterProps> = (
	props
) => {
	const {
		wire,
		fieldMetadata,
		context,
		condition,
		path,
		displayTemplate,
		filterConditions,
		returnFields,
		searchFields,
		order,
	} = props
	const wireId = wire.getId()
	const options = {
		template: displayTemplate,
		returnFields: getReturnFields(
			displayTemplate,
			returnFields,
			searchFields
		),
		searchFields,
		conditions: filterConditions,
		order,
	} as ReferenceFieldOptions
	return (
		<ReferenceField
			path={path}
			mode={"EDIT"}
			fieldId={fieldMetadata.getId()}
			fieldMetadata={fieldMetadata}
			context={context}
			variant={"uesio/io.filter"}
			options={options}
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
