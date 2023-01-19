import { component, definition } from "@uesio/ui"
import { get, set } from "../api/defapi"
import { FullPath } from "../api/path"

interface NumberProps {
	label: string
	path: FullPath
}

const NumberProp: definition.UtilityComponent<NumberProps> = ({
	context,
	path,
	label,
}) => {
	const NumberField = component.getUtility("uesio/io.numberfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	return (
		<FieldWrapper
			labelPosition="left"
			label={label}
			context={context}
			variant="uesio/builder.propfield"
		>
			<NumberField
				value={get(context, path)}
				setValue={(value: number | null): void =>
					set(context, path, value)
				}
				context={context}
				variant="uesio/io.field:uesio/builder.propfield"
			/>
		</FieldWrapper>
	)
}

export default NumberProp
