import { FC } from "react"
import PropertiesPane from "../propertiespane"
import { builder, context, hooks, collection, definition } from "@uesio/ui"

type T = {
	valueAPI: builder.ValueAPI
	path: string
	context: context.Context
}
type SignalBand = "WIRE" | "ROUTE" | "USER" | "BOT" | "PANEL" | "NOTIFICATION"
const bands: SignalBand[] = [
	"WIRE",
	"ROUTE",
	"USER",
	"BOT",
	"PANEL",
	"NOTIFICATION",
]
const addBlankSelectOption = collection.addBlankSelectOption

const SignalProp: FC<T> = (props) => {
	const { context, path, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const signalName = valueAPI.get(path + `["signal"]`) as string
	const band = signalName?.split("/")[0]?.toUpperCase()

	// Signals that belong to a band
	const signalOptions = Object.entries(
		uesio.signal.getSignalsByBand(band)
	).map(([key, description]) => ({
		label: description.label,
		value: key,
	}))

	const selectedSignalProperties =
		uesio.signal.getSignalDescriptor(signalName)?.properties || []

	// When changing signal, don't throw away values we can re-use.
	const getExistingValues = () => {
		if (!selectedSignalProperties) return {}
		const currentDef = valueAPI.get(path) as Record<
			string,
			definition.Definition
		>
		if (!currentDef) return {}
		return selectedSignalProperties.reduce(
			(prev, { name }) => ({
				...prev,
				[name]: currentDef[name],
			}),
			{}
		)
	}

	return (
		<PropertiesPane
			path={path}
			index={0}
			context={context}
			propsDef={{
				title: "Signal",
				sections: [],
				defaultDefinition: () => ({}),
				properties: [
					{
						label: "Type",
						name: "band",
						type: "SELECT",
						options: addBlankSelectOption(
							bands.map((type) => ({
								label: type.toLowerCase(),
								value: type,
							})),
							"Select a type"
						),
					},
					{
						label: "Signal",
						name: "signal",
						type: "SELECT",
						options: addBlankSelectOption(
							signalOptions,
							"Select a signal"
						),
					},
					...selectedSignalProperties,
				],
			}}
			valueAPI={{
				...valueAPI,
				get: (path: string) => {
					if (path?.endsWith(`["band"]`)) {
						return band
					}
					return valueAPI.get(path)
				},
				set: (setPath, value) => {
					// The first part of the signal name. e.g. wire/...
					if (setPath?.endsWith(`["band"]`)) {
						return valueAPI.set(path + `["signal"]`, value + "/")
					}
					if (setPath?.endsWith(`["signal"]`)) {
						return valueAPI.set(path, {
							signal: value,
							...getExistingValues(),
						})
					}
					return valueAPI.set(setPath, value)
				},
			}}
		/>
	)
}

export default SignalProp
