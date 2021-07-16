import { FC, useState, useEffect } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { definition, component, hooks, builder } from "@uesio/ui"
import ExpandPanel from "../expandpanel"

import ComponentVariantPicker from "../../utility/studio.componentvariantpicker/componentvariantpicker"
import StylesSection from "../buildproparea/stylessection"

interface T extends PropRendererProps {
	descriptor: builder.MetadataProp
}

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

	return [state, setState, updateStyles]
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

	console.log(
		"look here 	baseDefinition",
		baseDefinition,
		`["${componentToEdit}"]`
	)

	const [componentVariant, setComponentVariant] = useState<any>()
	const [draft, setDraft, updateStyles] = useDraft(componentVariant)

	useEffect(() => {
		setDraft(componentVariant)
	}, [componentVariant])

	const updateComponent = (id: string) =>
		setComponentVariant(context.getComponentVariant(id))

	return (
		<div>
			<ComponentVariantPicker
				metadataType={metadataType}
				label={descriptor.label}
				updateComponent={updateComponent}
				context={context}
				componentToEdit={componentToEdit}
			/>
			{componentToEdit}
			{draft && (
				<div>
					<TextField
						hideLabel
						value={draft.name}
						// mode={mode}
						context={context}
						// setValue={(
						// 	setValue(newValue)
						// }}
					/>

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

					{/* Wires */}
					{/* Signals */}

					<pre>{JSON.stringify(draft, null, 4)}</pre>
				</div>
			)}
		</div>
	)
}
ComponentVariantProp.displayName = "ComponentVariantProp"
export default ComponentVariantProp
