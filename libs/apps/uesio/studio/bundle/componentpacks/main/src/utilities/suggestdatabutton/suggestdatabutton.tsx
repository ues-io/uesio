import { component, definition, api, context, styles } from "@uesio/ui"
import { useState } from "react"
import { parse } from "best-effort-json-parser"

type Props = {
	prompt: string
	label: string
	loadingLabel: string
	handleResults: (results: unknown[]) => void
	icon?: string
	targetTableId?: string
}

type AutocompleteResponse = {
	choices?: string[]
	errors?: string[]
}

const handleAutocompleteData = (
	context: context.Context,
	response: AutocompleteResponse,
	handleResults: (results: unknown[]) => void
) => {
	if (response.errors) {
		return
	}
	if (response.choices?.length) {
		const data = response.choices[0] as string
		try {
			const dataArray: unknown[] = parse(data)
			if (dataArray?.length) {
				handleResults(dataArray)
			}
		} catch (e) {
			console.error(e)
			// eslint-disable-next-line no-empty
		}
	}
}

const StyleDefaults = Object.freeze({
	pulse: ["animate-pulse"],
})

const SuggestDataButton: definition.UtilityComponent<Props> = (props) => {
	const {
		context,
		prompt,
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
				setLoading(true)

				const signalResult = api.signal.run(
					{
						signal: "ai/AUTOCOMPLETE",
						model: "gpt-3.5-turbo",
						format: "chat",
						input: context.merge(prompt),
						stepId: "autocomplete",
						maxResults: 1,
					},
					context
				) as Promise<context.Context>

				signalResult.then((resultContext) => {
					setLoading(false)
					const result =
						resultContext.getSignalOutputs("autocomplete")
					if (!result) return
					handleAutocompleteData(context, result.data, handleResults)
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
			}}
		/>
	)
}

export default SuggestDataButton
