import { definition, component, styles } from "@uesio/ui"
import {
	getBuilderNamespaces,
	getComponentDef,
	setSelectedPath,
	useSelectedComponentPath,
} from "../../api/stateapi"
import ItemTag from "../../utilities/itemtag/itemtag"
import NamespaceLabel from "../../utilities/namespacelabel/namespacelabel"
import PropNodeTag from "../../utilities/propnodetag/propnodetag"
import { FullPath } from "../../api/path"

const StyleDefaults = Object.freeze({
	slot: ["border-l-4", "ml-1", "border-slate-50"],
	slotSelected: ["border-l-4", "ml-1", "border-slate-200"],
	tag: ["py-1", "px-1.5", "m-0"],
	tagtitle: ["uppercase", "font-light", "text-[8pt]", "mb-0"],
})

const IndexComponent: definition.UC = (props) => {
	const { componentType, context, path, definition } = props
	const { [component.COMPONENT_ID]: componentId } = definition
	const componentDef = getComponentDef(componentType)
	const classes = styles.useStyleTokens(StyleDefaults, props)

	const selectedPath = useSelectedComponentPath(context)

	const viewDefId = context.getViewDefId()

	const fullPath = new FullPath("viewdef", viewDefId, path)

	if (!componentDef) return null
	const nsInfo = getBuilderNamespaces(context)[componentDef.namespace]
	const isSelected = selectedPath.equals(fullPath)
	const searchTerm = (context.getComponentData("uesio/builder.indexpanel")
		?.data?.searchTerm || "") as string

	const isVisible =
		!searchTerm ||
		componentType?.includes(searchTerm) ||
		componentId?.includes(searchTerm)

	return (
		<div>
			{isVisible && (
				<PropNodeTag
					variant="uesio/builder.indextag"
					context={context}
					key={path}
					onClick={() => {
						setSelectedPath(context, fullPath)
					}}
					selected={isSelected}
				>
					<ItemTag
						classes={{
							root: classes.tag,
							title: classes.tagtitle,
						}}
						context={context}
					>
						<NamespaceLabel
							metadatakey={componentDef.namespace}
							metadatainfo={nsInfo}
							title={`${componentDef.title || componentDef.name}${
								componentId ? ` (${componentId})` : ""
							}`}
							icon={componentDef.icon}
							context={context}
						/>
					</ItemTag>
				</PropNodeTag>
			)}

			<div className={isSelected ? classes.slotSelected : classes.slot}>
				{componentDef.slots?.map((slot) =>
					component
						.getSlotProps({
							listName: slot.name,
							definition,
							path,
							context,
						})
						.map((props, index) => (
							<IndexComponent {...props} key={index} />
						))
				)}
			</div>
		</div>
	)
}

export default IndexComponent
