import { definition, component, styles } from "@uesio/ui"
import { setSelectedPath } from "../../api/stateapi"
import IndexComponent from "./indexcomponent"
import { standardAccepts } from "../../helpers/dragdrop"
import { usePlaceHolders } from "../../utilities/buildwrapper/buildwrapper"
import { FullPath } from "../../api/path"
import ActionButton from "../../helpers/actionbutton"
import { remove, set } from "../../api/defapi"

const StyleDefaults = Object.freeze({
	placeholder: [
		"bg-blue-600",
		"py-2",
		"px-3",
		"grid",
		"m-1",
		"rounded-sm",
		"items-center",
	],
})

const IndexBuildWrapper: definition.UC = (props) => {
	const { children, path, context } = props

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
	const [addBefore, addAfter] = usePlaceHolders(context, path)

	return (
		<div className="contents" data-placeholder="true">
			{addBefore && (
				<div className={classes.placeholder} data-placeholder="true" />
			)}
			{children}
			{addAfter && (
				<div className={classes.placeholder} data-placeholder="true" />
			)}
		</div>
	)
}

type IndexSlotProps = {
	slot: component.SlotDef
	selectedPath: FullPath
	parentSelected?: boolean
	indent?: boolean
} & definition.BaseProps

const SlotStyleDefaults = Object.freeze({
	slot: ["border-slate-50", "bg-white"],
	slotSelected: [
		"border-[$Theme{color:primary}]",
		"border-1",
		"mt-1",
		"bg-white",
	],
	slotIndent: ["border-l-4"],
	slotHeader: ["border-b-1", "border-slate-200", "flex"],
	slotContent: ["pt-1", "pl-1", "grid", "gap-1"],
	slotContentSelected: ["p-1", "grid", "gap-1"],
	slotTitle: [
		"uppercase",
		"text-slate-500",
		"font-light",
		"text-[7pt]",
		"grow",
		"p-0.5",
	],
	visibilityIcon: ["text-[8pt]", "text-slate-400", "mr-1", "mt-0.5"],
	actionarea: ["text-right", "bg-slate-50"],
})

const IndexSlot: definition.UtilityComponent<IndexSlotProps> = (props) => {
	const IOIcon = component.getUtility("uesio/io.icon")
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const {
		context,
		slot,
		path,
		definition,
		indent,
		selectedPath,
		parentSelected,
	} = props
	const listName = slot.name
	const label = slot.label || listName || "Slot"

	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
	const classes = styles.useUtilityStyleTokens(SlotStyleDefaults, props)
	const slotPath = new FullPath("viewdef", context.getViewDefId(), listPath)
	const selected = selectedPath.equals(slotPath)

	if (!definition) return null

	const hasSlotNode = !!definition[listName]

	return (
		<div
			onClick={(e) => {
				setSelectedPath(context, slotPath)
				e.stopPropagation()
			}}
			className={styles.cx(
				indent && classes.slotIndent,
				selected || parentSelected
					? classes.slotContentSelected
					: classes.slotContent,
				selected ? classes.slotSelected : classes.slot
			)}
			data-accepts={standardAccepts.join(",")}
			data-path={component.path.toDataAttrPath(listPath)}
		>
			<div data-placeholder="true">
				<div className={classes.slotHeader}>
					<div className={classes.slotTitle}>{label}</div>
					{!hasSlotNode && (
						<IOIcon
							className={classes.visibilityIcon}
							context={context}
							icon="visibility_off"
						/>
					)}
				</div>
				<IOExpandPanel context={context} expanded={selected}>
					<div className={classes.actionarea}>
						<ActionButton
							title={hasSlotNode ? "Delete Contents" : "Activate"}
							onClick={() =>
								hasSlotNode
									? remove(context, slotPath)
									: set(context, slotPath, [])
							}
							icon={hasSlotNode ? "delete" : "visibility"}
							context={context}
						/>
					</div>
				</IOExpandPanel>
			</div>
			{component
				.getSlotProps({
					listName,
					definition,
					path,
					context,
				})
				.map((props, index) => (
					<IndexBuildWrapper key={index} {...props}>
						<IndexComponent
							selectedPath={selectedPath}
							{...props}
						/>
					</IndexBuildWrapper>
				))}
		</div>
	)
}

export default IndexSlot
