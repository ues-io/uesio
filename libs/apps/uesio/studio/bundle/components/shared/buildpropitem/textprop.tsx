import { FunctionComponent } from "react"

import { component, builder } from "@uesio/ui"

const TextField = component.registry.getUtility("uesio/io.textfield")
const FieldWrapper = component.registry.getUtility("uesio/io.fieldwrapper")

const TextProp: FunctionComponent<builder.PropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	<FieldWrapper
		labelPosition="left"
		label={descriptor.label}
		context={context}
		variant="uesio/studio.propfield"
	>
		<TextField
			variant="uesio/studio.propfield"
			value={valueAPI.get(path)}
			setValue={(value: string) => valueAPI.set(path, value)}
			context={context}
		/>
	</FieldWrapper>
)

export default TextProp
