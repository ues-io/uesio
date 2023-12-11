import { component, definition, api, context, styles, signal } from "@uesio/ui"
import { useCallback, useState } from "react"

type Props = {
	prompt: string
	label: string
	loadingLabel: string
	handleResults: (results: unknown[]) => void
	integrationName?: string
	actionName?: string
	icon?: string
	targetTableId?: string
}

export type AutocompleteResponse = {
	data: object
}

const StyleDefaults = Object.freeze({
	pulse: ["animate-pulse"],
})
const stepId = "autocomplete"

const SuggestDataButton: definition.UtilityComponent<Props> = (props) => {
	const {
		context,
		prompt,
		integrationName = "uesio/core.bedrock",
		actionName = "streammodel",
		targetTableId,
		icon = "magic_button",
		handleResults,
		loadingLabel,
		label,
	} = props

	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const [isLoading, setLoading] = useState(false)

	const handleAutocompleteData = useCallback(
		(resultContext: context.Context) => {
			const result = resultContext.getSignalOutputs(stepId)
			if (!result) {
				api.notification.addError(
					"Unable to suggest data, please try again!",
					resultContext
				)
				return
			}
			const autocompleteResponse = result.data as AutocompleteResponse
			try {
				handleResults([autocompleteResponse.data])
			} catch (e) {
				api.notification.addError(
					"Unable to suggest data, unexpected error: " + e,
					resultContext
				)
				return
			}
		},
		[handleResults]
	)

	return (
		<Button
			context={context}
			label={isLoading ? loadingLabel : label}
			variant="uesio/io.secondary"
			disabled={isLoading}
			icon={
				<Icon
					icon={icon}
					context={context}
					className={isLoading ? classes.pulse : ""}
				/>
			}
			onClick={() => {
				setLoading(true)
				const signalResult = api.signal.runMany(
					[
						{
							signal: "integration/RUN_ACTION",
							integration: integrationName,
							action: actionName,
							stepId,
							transform: "json",
							params: {
								input: prompt,
								model: "anthropic.claude-v2",
								temperature: 0.5,
							},
							onChunk: handleAutocompleteData,
						} as signal.SignalDefinition,
					],
					context
				) as Promise<context.Context>

				signalResult
					.then((resultContext) => {
						setLoading(false)
						if (targetTableId) {
							// Turn the target table into edit mode
							api.signal.run(
								{
									signal: "component/CALL",
									component: "uesio/io.table",
									componentsignal: "SET_EDIT_MODE",
									targettype: "specific",
									componentid: targetTableId,
								},
								resultContext
							) as Promise<context.Context>
						}
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

export default SuggestDataButton
