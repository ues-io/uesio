import { FunctionComponent } from "react"
import { hooks, definition, component } from "@uesio/ui"
import { getParamDefs } from "../preview/preview"

type PreviewDefinition = {
	fieldId: string
}

interface Props extends definition.BaseProps {
	definition: PreviewDefinition
}

const Button = component.registry.getUtility("uesio/io.button")

const PreviewButton: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const { fieldId } = definition
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()

	const params = getParamDefs(fieldId, record)
	const hasParams = Object.keys(params).length

	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No Workspace Context Provided")
	const appName = workspaceContext.app
	const workspaceName = workspaceContext.name
	const viewName = record?.getFieldValue<string>("uesio/studio.name")

	if (!record || !fieldId) return null

	const [handler, portals] = uesio.signal.useHandler([
		{
			signal: "panel/TOGGLE",
			panel: "previewPanel",
		},
	])
	return (
		<>
			{hasParams ? (
				<Button
					context={context}
					variant="uesio/io.secondary"
					label="Preview"
					path={props.path}
					onClick={() => {
						handler && handler()
					}}
				/>
			) : (
				<Button
					context={context}
					variant="uesio/io.secondary"
					label="Preview"
					onClick={() => {
						uesio.signal.run(
							{
								signal: "route/REDIRECT",
								path: `/workspace/${appName}/${workspaceName}/views/${appName}/${viewName}/preview`,
							},
							context
						)
					}}
				/>
			)}
			{portals}
		</>
	)
}

export default PreviewButton
