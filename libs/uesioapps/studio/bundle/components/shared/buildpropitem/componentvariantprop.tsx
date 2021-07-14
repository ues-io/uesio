import { FC, useState } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { definition, component, hooks, builder } from "@uesio/ui"
import ComponentVariantPicker from "../../utility/studio.componentvariantpicker/componentvariantpicker"
interface T extends PropRendererProps {
	descriptor: builder.MetadataProp
}

const ComponentVariantProp: FC<T> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, setValue, descriptor } = props
	const metadataType = descriptor.metadataType
	const selectedNode = uesio.builder.useSelectedNode()
	const componentToEdit = component.path.toPath(selectedNode)[1]

	const [componentVariant, setComponentVariant] = useState<any>()

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
			{componentVariant && (
				<div>
					<h1>{componentVariant.label}</h1>
				</div>
			)}
		</div>
	)
}
ComponentVariantProp.displayName = "ComponentVariantProp"
export default ComponentVariantProp
