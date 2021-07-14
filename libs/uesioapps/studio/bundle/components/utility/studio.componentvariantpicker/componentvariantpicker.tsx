import { FC, useState, useEffect } from "react"
import { definition, component, hooks, metadata, collection } from "@uesio/ui"

interface T extends definition.UtilityProps {
	namesp?: "string"
	updateComponent: (id: string) => void
	componentToEdit: string
}

const Grid = component.registry.getUtility("io.grid")
const SelectField = component.registry.getUtility("io.selectfield")

const addBlankSelectOption = collection.addBlankSelectOption

type VariantOption = {
	label: string
	value: string
}

const ComponentVariantPicker: FC<T> = (props) => {
	const { context, updateComponent, componentToEdit } = props
	const uesio = hooks.useUesio(props)
	const namespaces = uesio.builder.useAvailableNamespaces(context)
	const [namespace, setNamespace] = useState<string | null>(null)
	const [variants, setVariants] = useState<VariantOption[] | []>([])

	useEffect(() => {
		const newVariants = Object.values(context.getComponentVariants())
			.filter(
				(el: any) =>
					el.namespace === namespace &&
					el.component === componentToEdit
			)
			.map((el) => ({
				...el,
				label: el.label,
				value: `${el.component}.${el.namespace}.${el.name}`,
			}))
		setVariants(newVariants)
	}, [namespace, setVariants])

	return (
		<Grid
			context={context}
			styles={{
				root: {
					gridTemplateColumns: "1fr 1fr",
					columnGap: "10px",
				},
			}}
		>
			<SelectField
				context={context}
				label={"namespace"}
				value={namespace}
				options={addBlankSelectOption(
					Object.keys(namespaces || {}).map((key) => ({
						value: key,
						label: key,
					}))
				)}
				setValue={(value: string) => setNamespace(value)}
			/>
			<SelectField
				context={context}
				label={"variant"}
				options={addBlankSelectOption(variants) || []}
				setValue={(value: string) => {
					console.log("updating to ", value)
					return updateComponent(value)
				}}
			/>
		</Grid>
	)
}

ComponentVariantPicker.displayName = "ComponentVariantPicker"

export default ComponentVariantPicker
