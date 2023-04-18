import { component, definition, wire } from "@uesio/ui"

import { StructProperty as SP } from "../../properties/componentproperty"
import { FullPath } from "../../api/path"

type Definition = {
	property: SP
	path: FullPath
}

const StructProperty: definition.UC<Definition> = (props) => {
	const MapField = component.getUtility("uesio/io.mapfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const { context, definition } = props
	const { property } = definition

	// const selectedPath = useSelectedPath(context)

	const record = context.getRecord()
	if (!record) return null

	const structFields = property.fields || []
	const structData = record.getFieldValue(property.name) || {}

	return (
		<FieldWrapper
			label={property.label || property.name}
			labelPosition="left"
			context={context}
			variant="uesio/builder.propfield"
		>
			<MapField
				value={structData}
				noAdd
				setValue={(value: wire.FieldValue) =>
					record.update(property.name, value, context)
				}
				mode="EDIT"
				context={context}
				keys={structFields.map((f) => f.name)}
				keyField={{
					name: "name",
					label: "Param",
				}}
				valueField={{
					name: "value",
					label: "Value",
				}}
			/>
		</FieldWrapper>
	)
}

export default StructProperty
