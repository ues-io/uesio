import { FunctionComponent } from "react"

import { component, builder, collection } from "@uesio/ui"

const TextField = component.getUtility("uesio/io.textfield")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const TextAreaProp: FunctionComponent<builder.PropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	<FieldWrapper
		labelPosition="top"
		label={descriptor.label}
		context={context}
		variant="uesio/studio.propfield"
	>
		<TextField
			variant="uesio/studio.propfieldtextarea"
			value={valueAPI.get(path)}
			fieldMetadata={
				new collection.Field({
					name: "",
					namespace: "",
					label: "",
					createable: true,
					accessible: true,
					updateable: true,
					type: "LONGTEXT",
				})
			}
			setValue={(value: string) => valueAPI.set(path, value)}
			context={context}
		/>
	</FieldWrapper>
)

export default TextAreaProp
