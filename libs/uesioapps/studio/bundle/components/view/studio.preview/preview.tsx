import { FunctionComponent, useState, useEffect } from "react"
import { hooks, definition, util, component } from "@uesio/ui"
import { Scalar, YAMLMap } from "yaml"
import PreviewItem from "./previewitem"

export type ParamDefinition = {
	type: string
	collectionId: string
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
	const { context, definition } = props
	const { fieldId } = definition
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appName = view?.params?.appname
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
	const numberOfParams = params ? params.toJSON().length : 0

	const paramsToAdd: Record<string, ParamDefinition> = {}
	params?.items.forEach((item) => {
		const key = item.key.value
		paramsToAdd[key] = {
			type: item.value?.get("type") as string,
			collectionId: item.value?.get("collection") as string,
			required: item.value?.get("required") as boolean,
			defaultValue: item.value?.get("defaultValue") as string,
		}
	})

	const getInitialMatch = (): Record<string, string> => {
		let mappings: Record<string, string> = {}

		Object.entries(paramsToAdd).forEach(([key, ParamDefinition]) => {
			if (
				ParamDefinition.type === "text" &&
				ParamDefinition.defaultValue
			) {
				mappings = {
					...mappings,
					[key]: ParamDefinition.defaultValue,
				}
			}
		})

		return mappings
	}

	const [lstate, setLstate] = useState<Record<string, string>>(
		getInitialMatch()
	)

	useEffect(() => {
		if (!numberOfParams)
			uesio.signal.run(
				{
					signal: "route/REDIRECT",
					path: `/workspace/${newContext.getWorkspace()?.app}/${
						newContext.getWorkspace()?.name
					}/views/${appName}/${viewName}/preview`,
				},
				newContext
			)
	}, [params])

	return numberOfParams ? (
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
						item={ParamDefinition}
						context={newContext}
						lstate={lstate}
						setLstate={setLstate}
					/>
				)
			)}

			<Button
				context={newContext}
				variant="io.primary"
				label="Preview"
				onClick={() => {
					let getParams = "?"
					const size = Object.keys(lstate).length - 1
					Object.entries(lstate).forEach(([key, value], index) => {
						if (value !== "") {
							size > index
								? (getParams = getParams + `${key}=${value}&`)
								: (getParams = getParams + `${key}=${value}`)
						}
					})

					uesio.signal.run(
						{
							signal: "route/REDIRECT",
							path: `/workspace/${
								newContext.getWorkspace()?.app
							}/${
								newContext.getWorkspace()?.name
							}/views/${appName}/${viewName}/preview${getParams}`,
						},
						newContext
					)
				}}
			/>
		</>
	) : (
		<h3 style={{ textAlign: "center" }}>Building view</h3>
	)
}

export default Preview
