import { FunctionComponent } from "react"
import { hooks, definition, util, component } from "@uesio/ui"
import { Scalar, YAMLMap } from "yaml"

//TO-DO import this
type ParamDefinition = {
	type: string
	collection: string
	required: boolean
	defaultValue: string
}
//TO-DO import this

type PreviewDefinition = {
	fieldId: string
}

interface Props extends definition.BaseProps {
	definition: PreviewDefinition
}

const TextField = component.registry.getUtility("io.textfield")
const FieldWrapper = component.registry.getUtility("io.fieldwrapper")
const ReferenceField = component.registry.getUtility("io.referencefield")

const Preview: FunctionComponent<Props> = (props) => {
	const { path, context, definition } = props
	const { fieldId } = definition
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()

	if (!record || !fieldId) return null

	const viewDef = record.getFieldValue<string>(fieldId)
	const yamlDoc = util.yaml.parse(viewDef)
	const params = util.yaml.getNodeAtPath(
		["params"],
		yamlDoc.contents
	) as YAMLMap<Scalar<string>, YAMLMap>

	const paramsToAdd: Record<string, ParamDefinition> = {}
	params.items.forEach((item) => {
		const key = item.key.value
		paramsToAdd[key] = {
			type: item.value?.get("type") as string,
			collection: item.value?.get("collection") as string,
			required: item.value?.get("required") as boolean,
			defaultValue: item.value?.get("defaultValue") as string,
		}
	})

	return (
		<>
			{Object.entries(paramsToAdd).map(([key, ParamDefinition], index) =>
				ParamDefinition.type === "text" ? (
					<FieldWrapper
						context={context}
						label={key}
						key={key + index}
					>
						<TextField
							variant="io.default"
							value={ParamDefinition.defaultValue}
							//setValue={(value: string) => valueAPI.set(path, value)}
							context={context}
						/>
					</FieldWrapper>
				) : (
					<FieldWrapper
						context={context}
						label={key}
						key={key + index}
					>
						<ReferenceField
							variant="io.default"
							value={ParamDefinition.defaultValue}
							//setValue={(value: string) => valueAPI.set(path, value)}
							context={context}
						/>
					</FieldWrapper>
				)
			)}
		</>
	)
}

export default Preview
