import { FC, useState, useEffect } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { wire, component, hooks, builder } from "@uesio/ui"
import ExpandPanel from "../expandpanel"

import ComponentVariantPicker from "../../utility/studio.componentvariantpicker/componentvariantpicker"
import WiresProp from "./wiresprop"
import SignalsSection from "../buildproparea/signalssection"

interface T extends PropRendererProps {
	descriptor: builder.MetadataProp
}
const MultiSelectField = component.registry.getUtility("io.multiselectfield")

const TextField = component.registry.getUtility("io.textfield")
const ListField = component.registry.getUtility("io.listfield")
type StyleValue = {
	key: string
	value: string
}

type ComponentVariant = any

const useDraft = (initialValue: ComponentVariant) => {
	const [state, setState] = useState(initialValue)

	const updateStyles = (className: string, newStyles: any) =>
		setState({
			...state,
			definition: {
				["uesio.styles"]: {
					[className]: newStyles.reduce(
						(obj: any, item: any) => ({
							...obj,
							[item.key]: item.value,
						}),
						{}
					),
				},
			},
		})

	const addSignal = (signal: any) => {
		console.log("adding signal in parent")
		setState({
			...state,
			signals: [
				{
					signal: "wire/CREATE_RECORD",
					wire: "contacts",
				},
			],
		})
	}
	return [state, setState, updateStyles, addSignal]
}

const ComponentVariantProp: FC<T> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, setValue, descriptor } = props
	const metadataType = descriptor.metadataType
	const selectedNode = uesio.builder.useSelectedNode()
	const componentToEdit = component.path.toPath(selectedNode)[1]

	const baseDefinition = component.registry.getPropertiesDefinitionFromPath(
		`["${componentToEdit}"]`
	)

	const [componentVariant, setComponentVariant] = useState<any>()
	const [draft, setDraft, updateStyles, addSignal] = useDraft(
		componentVariant
	)

	useEffect(() => {
		setDraft(componentVariant)
	}, [componentVariant, componentToEdit])

	const updateComponent = (id: string) =>
		setComponentVariant(context.getComponentVariant(id))

	const wires = uesio.view.useDefinition(
		'["wires"]'
	) as wire.WireDefinitionMap
	return (
		<div>
			<ComponentVariantPicker
				metadataType={metadataType}
				label={descriptor.label}
				updateComponent={updateComponent}
				context={context}
				componentToEdit={componentToEdit}
			/>
			{draft && baseDefinition && (
				<div>
					<p>
						{componentToEdit} | {draft.name}{" "}
					</p>

					{/* Styles */}
					<ExpandPanel
						defaultExpanded={false}
						title={"Styles"}
						context={context}
					>
						{baseDefinition?.classes &&
							baseDefinition.classes.map((className) => {
								const data =
									draft.definition["uesio.styles"][className]
								return (
									<ListField
										label={className}
										value={
											data
												? Object.keys(data).map(
														(key) => ({
															key,
															value: data[key],
														})
												  )
												: []
										}
										autoAdd
										subFields={[
											{
												name: "key",
											},
											{ name: "value" },
										]}
										setValue={(value: StyleValue[]) =>
											updateStyles(className, value)
										}
										mode="EDIT"
										context={context}
									/>
								)
							})}
					</ExpandPanel>

					{/* Signals */}
					<ExpandPanel
						defaultExpanded={false}
						title={"Signals"}
						context={context}
					>
						<SignalsSection
							section={{ type: "SIGNALS", title: "Signals" }}
							propsDef={baseDefinition}
							// path={path}
							definition={{ key: "string" }}
							context={context}
							variantSignals={draft.signals || []}
							addSignalToVariant={(s) => addSignal(s)}
						/>
					</ExpandPanel>

					{/* Wires */}
					<ExpandPanel
						defaultExpanded={false}
						title={"Wires"}
						context={context}
					>
						<MultiSelectField
							getValue={() => "contacts"}
							label={descriptor.label}
							setValue={setValue}
							options={Object.keys(wires || {}).map((wireId) => ({
								value: wireId,
								label: wireId,
							}))}
							context={context}
						/>
					</ExpandPanel>

					<pre>{JSON.stringify(draft, null, 4)}</pre>
				</div>
			)}
		</div>
	)
}
ComponentVariantProp.displayName = "ComponentVariantProp"
export default ComponentVariantProp
