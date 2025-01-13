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
	indent?: boolean
} & definition.BaseProps

const SlotStyleDefaults = Object.freeze({
	slot: ["grid", "border-transparent"],
	slotSelected: ["rounded-lg", "bg-slate-800", "ml-1"],
	slotIndent: ["ml-2"],
	slotHeader: ["flex", "p-1"],
	slotHeaderSelected: ["p-2"],
	slotTitle: [
		"uppercase",
		"text-slate-400",
		"font-light",
		"text-[7pt]",
		"grow",
		"p-0.5",
	],
	slotContent: [],
	slotContentSelected: ["p-1", "empty:hidden"],
	visibilityIcon: ["text-[8pt]", "text-slate-400", "mr-1", "mt-0.5"],
	actionarea: [
		"text-right",
		"text-slate-200",
		"px-1",
		"border-b",
		"border-slate-900",
	],
})

const IndexSlot: definition.UtilityComponent<IndexSlotProps> = (props) => {
	const IOIcon = component.getUtility("uesio/io.icon")
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const { context, slot, path, definition, indent, selectedPath } = props
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
				classes.slot,
				selected && classes.slotSelected
			)}
			data-accepts={standardAccepts.join(",")}
			data-path={component.path.toDataAttrPath(listPath)}
		>
			<div data-placeholder="true">
				<div
					className={styles.cx(
						classes.slotHeader,
						selected && classes.slotHeaderSelected
					)}
				>
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
			<div
				className={styles.cx(
					classes.slotContent,
					selected && classes.slotContentSelected
				)}
			>
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
		</div>
	)
}

export default IndexSlot
