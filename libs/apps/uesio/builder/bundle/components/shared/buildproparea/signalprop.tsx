import { FC } from "react"
import PropertiesPane from "../propertiespane"
import { builder, context, hooks, collection, definition } from "@uesio/ui"

type T = {
	valueAPI: builder.ValueAPI
	path: string
	context: context.Context
}
type SignalBand =
	| "WIRE"
	| "ROUTE"
	| "USER"
	| "BOT"
	| "PANEL"
	| "NOTIFICATION"
	| "COMPONENT"
const bands: SignalBand[] = [
	"WIRE",
	"ROUTE",
	"USER",
	"BOT",
	"PANEL",
	"NOTIFICATION",
	"COMPONENT",
]
const addBlankSelectOption = collection.addBlankSelectOption

const SignalProp: FC<T> = (props) => {
	const { context, path, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const signalFullName = valueAPI.get(path + `["signal"]`) as string
	const selectedComponent = signalFullName.split("/").slice(1, 3).join("/")
	const band = signalFullName?.split("/")[0]?.toUpperCase() as SignalBand
	const componentSignalRegistry = uesio.component.getSignals()
	const isComponent = band === "COMPONENT"

	const getComponentSignals = () =>
		Object.fromEntries(
			Object.entries(componentSignalRegistry).flatMap(
				([componentName, signals]) =>
					Object.entries(signals).map(([signalId, signal]) => [
						`component/${componentName}/${signalId}`,
						{
							...signal,
							properties: (): builder.PropDescriptor[] => [
								...(componentName !== "uesio/core.view"
									? ([
											{
												name: "target",
												type: "TEXT",
												label: "Component ID",
											},
									  ] as builder.PropDescriptor[])
									: []),
								...(signal.properties
									? signal.properties({ signal: signalId })
									: []),
							],
						},
					])
			)
		)

	// Signals that belong to a band
	const signals = isComponent
		? Object.entries(getComponentSignals()).filter(([key]) =>
				key.startsWith(signalFullName)
		  )
		: Object.entries(uesio.signal.getSignalsByBand(band))

	const signalOptions = signals.map(([key, description]) => ({
		label: description.label || "",
		value: key,
	}))

	const selectedSignalProperties = isComponent
		? getComponentSignals()[signalFullName]?.properties() || []
		: uesio.signal
				.getSignalDescriptor(signalFullName)
				?.properties({ signal: signalFullName }) || []

	// When changing signal, don't throw away propvalues we can re-use.
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
					...(isComponent
						? [
								{
									label: "Component",
									name: "component",
									type: "SELECT",
									options: addBlankSelectOption(
										Object.keys(
											componentSignalRegistry
										).map((el) => ({
											label: el,
											value: `component/${el}`,
										})),
										"Select a component"
									),
								} as builder.PropDescriptor,
						  ]
						: []),
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
					if (path?.endsWith(`["band"]`)) return band
					if (path?.endsWith(`["component"]`))
						return `component/${selectedComponent}`
					return valueAPI.get(path)
				},
				set: (setPath, value) => {
					// The first part of the signal name. e.g. wire/...
					if (
						setPath?.endsWith(`["band"]`) ||
						setPath?.endsWith(`["component"]`)
					)
						return valueAPI.set(path + `["signal"]`, value)

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
