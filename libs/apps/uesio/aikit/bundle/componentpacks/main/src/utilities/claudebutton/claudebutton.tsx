import { component, definition, api, context } from "@uesio/ui"
import { useState } from "react"
import { getClaudeResponseHandler, Tool, ToolChoice } from "./claude"
import { getClaudeArrayStreamHandler } from "./stream"

type Props = {
	prompt: string
	label: string
	loadingLabel: string
	onTextComplete?: (result: string) => void
	onTextJSONArrayItem?: (item: unknown) => void
	onTextDelta?: (delta: string) => void
	onToolUse?: (tool: string, inputs: unknown) => void
	onToolUseDelta?: (tool: string, delta: string) => void
	icon?: string
	tools?: Tool[]
	toolChoice?: ToolChoice
	onSuccess?: (context: context.Context) => void
}

const stepId = "autocomplete"

const ClaudeInvokeButton: definition.UtilityComponent<Props> = (props) => {
	const {
		context,
		prompt,
		icon = "magic_button",
		onTextComplete,
		onToolUse,
		onToolUseDelta,
		onTextJSONArrayItem,
		loadingLabel,
		label,
		tools,
		toolChoice,
		onSuccess,
	} = props

	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")

	const onTextDelta = onTextJSONArrayItem
		? getClaudeArrayStreamHandler({
				onItem: onTextJSONArrayItem,
			})
		: props.onTextDelta

	const [isLoading, setLoading] = useState(false)

	return (
		<Button
			context={context}
			label={label}
			variant="uesio/io.secondary"
			isPending={isLoading}
			pendingLabel={loadingLabel}
			icon={<Icon icon={icon} context={context} />}
			onClick={() => {
				setLoading(true)
				api.signal
					.runMany(
						[
							{
								signal: "integration/RUN_ACTION",
								integration: "uesio/aikit.bedrock",
								action: "streammodel",
								stepId,
								params: {
									input: prompt,
									model: "anthropic.claude-3-haiku-20240307-v1:0",
									temperature: 0.5,
									tools,
									tool_choice: toolChoice,
								},
								onChunk: getClaudeResponseHandler({
									onTextComplete,
									onTextDelta,
									onToolUse,
									onToolUseDelta,
								}),
							},
						],
						context
					)
					.then((resultContext) => {
						setLoading(false)
						onSuccess?.(resultContext)
					})
					.catch((e) => {
						setLoading(false)
						api.notification.addError(
							"Unable to suggest data, unexpected error: " + e,
							context
						)
					})
			}}
		/>
	)
}

export default ClaudeInvokeButton
