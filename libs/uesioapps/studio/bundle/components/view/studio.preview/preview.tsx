import { FunctionComponent, useState } from "react"
import { hooks, definition, util, component } from "@uesio/ui"
import { Pair, Scalar, YAMLMap } from "yaml"
import PreviewItem from "./previewitem"

export type ParamDefinition = {
	type: string
	collectionId: string
	fieldId: string
	required: boolean
	defaultValue: string
}

type PreviewDefinition = {
	fieldId: string
}

interface Props extends definition.BaseProps {
	definition: PreviewDefinition
}

const TextField = component.registry.getUtility("io.textfield")
const FieldWrapper = component.registry.getUtility("io.fieldwrapper")
const Button = component.registry.getUtility("io.button")

const Preview: FunctionComponent<Props> = (props) => {
	const { path, context, definition } = props
	const { fieldId } = definition
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appName = view?.params?.appname
	let newContext = props.context
	if (appName) {
		if (workspaceName) {
			newContext = context.addFrame({
				workspace: {
					name: workspaceName,
					app: appName,
				},
			})
		}
	}
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
			collectionId: item.value?.get("collection") as string,
			fieldId: item.value?.get("field") as string,
			required: item.value?.get("required") as boolean,
			defaultValue: item.value?.get("defaultValue") as string,
		}
	})

	const [lstate, setLstate] = useState<Record<string, string>>()

	return (
		<>
			{Object.entries(paramsToAdd).map(([key, ParamDefinition], index) =>
				ParamDefinition.type === "text" ? (
					<FieldWrapper
						context={newContext}
						label={key}
						key={key + index}
					>
						<TextField
							variant="io.default"
							value={ParamDefinition.defaultValue}
							setValue={(value: string) =>
								setLstate({ key: value })
							}
							context={newContext}
						/>
					</FieldWrapper>
				) : (
					<PreviewItem
						fieldKey={key}
						item={ParamDefinition}
						context={newContext}
					/>
				)
			)}
			<Button
				context={context}
				variant="io.primary"
				label="Preview"
				onClick={() => alert("")}
			/>
		</>
	)
}

export default Preview
