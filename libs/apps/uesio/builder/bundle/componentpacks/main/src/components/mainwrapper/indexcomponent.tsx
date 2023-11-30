import { definition, component, styles } from "@uesio/ui"
import {
	getBuilderNamespaces,
	getComponentDef,
	setSelectedPath,
	useSelectedComponentPath,
} from "../../api/stateapi"
import ItemTag from "../../utilities/itemtag/itemtag"
import PropNodeTag from "../../utilities/propnodetag/propnodetag"
import { FullPath } from "../../api/path"
import IndexSlot from "./indexslot"
import DeleteAction from "../../actions/deleteaction"
import MoveActions from "../../actions/moveactions"
import CloneAction from "../../actions/cloneaction"

const StyleDefaults = Object.freeze({
	tag: ["py-1", "px-1.5", "m-0", "bg-slate-100"],
	tagtitle: ["uppercase", "font-light", "text-[8pt]", "mb-0"],
	actionarea: ["text-right", "bg-slate-50", "text-slate-700"],
})

const IndexComponent: definition.UC = (props) => {
	const { componentType, context, path, definition } = props
	const componentDef = getComponentDef(componentType)
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const NamespaceLabel = component.getUtility("uesio/io.namespacelabel")
	const classes = styles.useStyleTokens(StyleDefaults, props)

	const selectedPath = useSelectedComponentPath(context)

	const viewDefId = context.getViewDefId()

	const fullPath = new FullPath("viewdef", viewDefId, path)
	const [, parentPath] = fullPath.pop()

	if (!componentDef) return null
	const nsInfo = getBuilderNamespaces(context)[componentDef.namespace]
	const isSelected = selectedPath.equals(fullPath)
	const searchTerm = (context.getComponentData("uesio/builder.indexpanel")
		?.data?.searchTerm || "") as string

	if (!definition) return null

	const { [component.COMPONENT_ID]: componentId } = definition

	const isVisible =
		!searchTerm ||
		componentType?.includes(searchTerm) ||
		componentId?.includes(searchTerm)

	return isVisible ? (
		<PropNodeTag
			variant="uesio/builder.indextag"
			context={context}
			draggable={fullPath.combine()}
			key={path}
			onClick={(e) => {
				setSelectedPath(context, fullPath)
				e.stopPropagation()
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
			<IOExpandPanel context={context} expanded={isSelected}>
				<div className={classes.actionarea}>
					<DeleteAction context={context} path={parentPath} />
					<MoveActions context={context} path={parentPath} />
					<CloneAction context={context} path={parentPath} />
				</div>
			</IOExpandPanel>
			{componentDef.slots?.map((slot) => (
				<IndexSlot
					key={slot.name}
					slot={slot}
					indent={true}
					definition={definition}
					path={path}
					context={context}
				/>
			))}
		</PropNodeTag>
	) : null
}

export default IndexComponent
