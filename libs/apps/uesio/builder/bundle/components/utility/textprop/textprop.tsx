import { component, builder } from "@uesio/ui"

const TextField = component.getUtility("uesio/io.textfield")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const TextProp: builder.PropComponent<builder.TextProp> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	<FieldWrapper
		labelPosition="left"
		label={descriptor.label}
		context={context}
		variant="uesio/builder.propfield"
	>
		<TextField
			variant="uesio/io.field:uesio/builder.propfield"
			value={valueAPI.get(path)}
			setValue={(value: string) => valueAPI.set(path, value)}
			context={context}
		/>
	</FieldWrapper>
)

export default TextProp
