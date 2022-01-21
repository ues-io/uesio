import { FunctionComponent, useState } from "react"
import { hooks, definition, util, component } from "@uesio/ui"
import { Scalar, YAMLMap } from "yaml"

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

const Button = component.registry.getUtility("io.button")

const PreviewButton: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const { fieldId } = definition
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appName = view?.params?.appname
	const viewName = view?.params?.viewname
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

	const uesiopath = uesio.getPath()

	console.log({ uesiopath, fieldId, viewDef, yamlDoc, params })

	return (
		<>
			{params ? (
				<Button
					context={newContext}
					variant="io.primary"
					label="Preview"
					signlas={""}
					onClick={() => {
						console.log("run")
						uesio.signal.run(
							{
								signal: "panel/TOGGLE",
								panel: "previewPanel",
								path: uesiopath,
							},
							newContext
						)
					}}
				/>
			) : (
				<Button
					context={newContext}
					variant="io.secondary"
					label="Preview"
					onClick={() => {
						uesio.signal.run(
							{
								signal: "route/REDIRECT",
								path: `/workspace/${
									newContext.getWorkspace()?.app
								}/${
									newContext.getWorkspace()?.name
								}/views/${appName}/${viewName}/preview`,
							},
							newContext
						)
					}}
				/>
			)}
		</>
	)
}

export default PreviewButton
