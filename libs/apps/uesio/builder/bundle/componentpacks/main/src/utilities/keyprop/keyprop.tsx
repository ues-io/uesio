import { component, builder } from "@uesio/ui"

const KeyProp: builder.PropComponent<builder.KeyProp> = (props) => {
	const TextField = component.getUtility("uesio/io.textfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const { path, descriptor, context, valueAPI } = props
	if (!path) return null
	const key = component.path.getKeyAtPath(path)
	return (
		<FieldWrapper
			labelPosition="left"
			label={descriptor.label}
			context={context}
			variant="uesio/builder.propfield"
		>
			<TextField
				variant="uesio/io.field:uesio/builder.propfield"
				value={key}
				setValue={(value: string): void =>
					valueAPI.changeKey(path, value)
				}
				context={context}
			/>
		</FieldWrapper>
	)
}

export default KeyProp
