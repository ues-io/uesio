import { FunctionComponent, useState, useEffect } from "react"
import {
	hooks,
	definition,
	util,
	component,
	collection,
	param,
	wire,
} from "@uesio/ui"
import { Scalar, YAMLMap } from "yaml"
import PreviewItem from "./previewitem"

type PreviewDefinition = {
	fieldId: string
}

interface Props extends definition.BaseProps {
	definition: PreviewDefinition
}

const TextField = component.registry.getUtility("uesio/io.textfield")
const FieldWrapper = component.registry.getUtility("uesio/io.fieldwrapper")
const Button = component.registry.getUtility("uesio/io.button")
const Group = component.registry.getUtility("uesio/io.group")

const Preview: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const { fieldId } = definition
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appName = view?.params?.app
	const viewName = view?.params?.viewname

	const newContext =
		!appName || !workspaceName
			? props.context
			: context.addFrame({
					workspace: {
						name: workspaceName,
						app: appName,
					},
			  })

	if (!record || !fieldId) return null

	const viewDef = record.getFieldValue<string>(fieldId)
	const yamlDoc = util.yaml.parse(viewDef)
	const params = util.yaml.getNodeAtPath(
		["params"],
		yamlDoc.contents
	) as YAMLMap<Scalar<string>, YAMLMap>

	const paramObj = params.toJSON() as Record<string, param.ParamDefinition>

	const numberOfParams = paramObj ? Object.keys(paramObj).length : 0

	const getInitialMatch = (): Record<string, wire.FieldValue> => {
		let mappings: Record<string, string> = {}

		Object.entries(paramObj).forEach(([key, paramDefinition]) => {
			if (
				paramDefinition.type === "TEXT" &&
				paramDefinition.defaultValue
			) {
				mappings = {
					...mappings,
					[key]: paramDefinition.defaultValue,
				}
			}
		})

		return mappings
	}

	const [lstate, setLstate] = useState<Record<string, wire.FieldValue>>(
		getInitialMatch()
	)

	useEffect(() => {
		if (!numberOfParams) {
			uesio.signal.run(
				{
					signal: "route/REDIRECT",
					path: `/workspace/${newContext.getWorkspace()?.app}/${
						newContext.getWorkspace()?.name
					}/views/${appName}/${viewName}/preview`,
				},
				newContext
			)
		}
	}, [params])

	return numberOfParams ? (
		<>
			{Object.entries(paramObj).map(([key, paramDefinition], index) =>
				paramDefinition.type === "TEXT" ? (
					<FieldWrapper
						context={newContext}
						label={key}
						key={key + index}
					>
						<TextField
							variant="uesio/io.default"
							value={lstate[key]}
							setValue={(value: string) =>
								setLstate({
									...lstate,
									[key]: value,
								})
							}
							context={newContext}
						/>
					</FieldWrapper>
				) : (
					<PreviewItem
						key={key + index}
						fieldKey={key}
						item={paramDefinition}
						context={newContext}
						lstate={lstate}
						setLstate={setLstate}
					/>
				)
			)}

			<Group
				styles={{
					root: {
						justifyContent: "end",
						padding: "20px",
					},
				}}
				context={newContext}
			>
				<Button
					context={newContext}
					variant="uesio/io.primary"
					label="Preview"
					onClick={() => {
						const getParams = new URLSearchParams()

						Object.entries(paramObj).forEach(([key, value]) => {
							const lstateValue = lstate[key]
							if (value.type === "RECORD") {
								getParams.append(
									key,
									(lstateValue as wire.PlainWireRecord)[
										collection.ID_FIELD
									] as string
								)
							}
							if (value.type === "TEXT") {
								getParams.append(key, lstateValue as string)
							}
						})

						uesio.signal.run(
							{
								signal: "route/REDIRECT",
								path: `/workspace/${
									newContext.getWorkspace()?.app
								}/${
									newContext.getWorkspace()?.name
								}/views/${appName}/${viewName}/preview?${getParams}`,
							},
							newContext
						)
					}}
				/>
			</Group>
		</>
	) : (
		<h3 style={{ textAlign: "center" }}>Building view</h3>
	)
}

export default Preview
