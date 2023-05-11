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
	slot: [],
	tag: ["py-1", "px-1.5", "m-0"],
	tagtitle: ["uppercase", "font-light", "text-[8pt]", "mb-0"],
	spacerarea: ["shrink"],
	spacer: ["inline-block", "w-1.5", "h-full", "border-r", "border-slate-200"],
	contentwrapper: ["flex"],
	content: ["grow"],
})

const IndexComponent: definition.UC = (props) => {
	const { componentType, context, path, definition } = props
	const componentDef = getComponentDef(context, componentType)
	const classes = styles.useStyleTokens(StyleDefaults, props)

	const level = (definition.level || 0) as number

	const selectedPath = useSelectedComponentPath(context)

	const viewDefId = context.getViewDefId()

	const fullPath = new FullPath("viewdef", viewDefId, path)

	if (!componentDef) return null
	const nsInfo = getBuilderNamespaces(context)[componentDef.namespace]

	return (
		<div>
			<PropNodeTag
				variant="uesio/builder.indextag"
				context={context}
				key={path}
				onClick={() => {
					setSelectedPath(context, fullPath)
				}}
				selected={selectedPath.equals(fullPath)}
			>
				<div className={classes.contentwrapper}>
					<div className={classes.spacerarea}>
						{Array.from(Array(level).keys()).map((num) => (
							<div className={classes.spacer} key={num} />
						))}
					</div>
					<div className={classes.content}>
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
								title={componentDef.title || componentDef.name}
								context={context}
							/>
						</ItemTag>
					</div>
				</div>
			</PropNodeTag>

			<div className={classes.slot}>
				{componentDef.slots?.map((slot) =>
					component
						.getSlotProps({
							listName: slot.name,
							definition,
							path,
							context,
						})
						.map((props, index) => (
							<IndexComponent
								{...props}
								definition={{
									...props.definition,
									level: level + 1,
								}}
								key={index}
							/>
						))
				)}
			</div>
		</div>
	)
}

export default IndexComponent
