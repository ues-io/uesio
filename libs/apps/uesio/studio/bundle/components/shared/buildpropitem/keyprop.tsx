import React, { FunctionComponent, useState } from "react"
import { component, builder } from "@uesio/ui"

const TextField = component.getUtility("uesio/io.textfield")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const KeyProp: FunctionComponent<builder.PropRendererProps> = (props) => {
	const { path, descriptor, context, valueAPI } = props
	const key = component.path.getKeyAtPath(path || "")
	const [inputValue, setInputValue] = useState<string>(key || "")
	if (!path) return null
	return (
		<FieldWrapper
			labelPosition="left"
			label={descriptor.label}
			context={context}
			variant="uesio/studio.propfield"
		>
			<TextField
				variant="uesio/studio.propfield"
				value={inputValue}
				onChange={(
					e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
				) => setInputValue(e.target.value)}
				context={context}
				onBlur={() =>
					inputValue !== key && valueAPI.changeKey(path, inputValue)
				}
			/>
		</FieldWrapper>
	)
}

export default KeyProp
