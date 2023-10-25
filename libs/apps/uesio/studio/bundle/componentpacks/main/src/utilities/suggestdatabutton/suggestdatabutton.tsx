import { component, definition, api, context, styles, signal } from "@uesio/ui"
import { useState } from "react"
import { parse } from "best-effort-json-parser"

type Props = {
	label: string
	loadingLabel: string
	onClickSignals?: signal.SignalDefinition[]
	handleResults: (results: unknown[]) => void
	icon?: string
	targetTableId?: string
}

export type AutocompleteResponse = {
	data?: string
}

const OPENAI_JSON_PREAMBLE = "```json\n"

export const preparse = (data: string) => {
	if (!data) return data
	// OpenAI has started returnin "json```" blocks, so try to extract those
	if (data.includes(OPENAI_JSON_PREAMBLE)) {
		return data.substring(
			data.indexOf(OPENAI_JSON_PREAMBLE) + OPENAI_JSON_PREAMBLE.length,
			data.lastIndexOf("```")
		)
	} else if (data.includes("[")) {
		return data.substring(data.indexOf("["), data.lastIndexOf("]") + 1)
	} else {
		return data
	}
}

export const handleAutocompleteData = (
	response: AutocompleteResponse,
	handleResults: (results: unknown[]) => void
) => {
	const data = response?.data

	if (data) {
		const dataArray: unknown[] = parse(preparse(data))
		if (dataArray?.length) {
			handleResults(dataArray)
		}
	}
}

const StyleDefaults = Object.freeze({
	pulse: ["animate-pulse"],
})

const SuggestDataButton: definition.UtilityComponent<Props> = (props) => {
	const {
		context,
		onClickSignals,
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
				if (!onClickSignals) return
				setLoading(true)

				const signalResult = api.signal.runMany(
					onClickSignals,
					context
				) as Promise<context.Context>

				signalResult
					.then((resultContext) => {
						setLoading(false)
						const result =
							resultContext.getSignalOutputs("autocomplete")
						if (!result) {
							api.notification.addError(
								"Unable to suggest data, please try again!",
								context
							)
							return
						}
						try {
							handleAutocompleteData(result.data, handleResults)
						} catch (e) {
							api.notification.addError(
								"Unable to suggest data, unexpected error: " +
									e,
								context
							)
							return
						}

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
								context
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
