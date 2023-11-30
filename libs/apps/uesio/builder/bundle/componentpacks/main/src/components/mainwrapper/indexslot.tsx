import { definition, component, styles } from "@uesio/ui"
import { SlotDef, setSelectedPath } from "../../api/stateapi"
import IndexComponent from "./indexcomponent"
import { standardAccepts } from "../../helpers/dragdrop"
import { usePlaceHolders } from "../../utilities/buildwrapper/buildwrapper"
import { FullPath } from "../../api/path"

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
	slot: SlotDef
	selected?: boolean
	indent?: boolean
} & definition.BaseProps

const SlotStyleDefaults = Object.freeze({
	slot: ["border-slate-50"],
	slotIndent: ["border-l-4", "ml-1"],
	slotSelected: ["border-slate-200"],
	slotheader: [
		"mx-1",
		"mt-1",
		"border-b-1",
		"border-slate-200",
		"text-slate-500",
		"font-light",
		"text-[8pt]",
		"pt-1",
		"px-0.5",
		"uppercase",
	],
})

const IndexSlot: definition.UtilityComponent<IndexSlotProps> = (props) => {
	const { context, slot, path, definition, indent, selected } = props
	const listName = slot.name
	const label = slot.label || "Slot"

	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
	const classes = styles.useUtilityStyleTokens(SlotStyleDefaults, props)

	if (!definition) return null

	return (
		<div
			onClick={(e) => {
				setSelectedPath(
					context,
					new FullPath("viewdef", context.getViewDefId(), listPath)
				)
				e.stopPropagation()
			}}
			className={styles.cx(
				indent && classes.slotIndent,
				selected ? classes.slotSelected : classes.slot
			)}
			data-accepts={standardAccepts.join(",")}
			data-path={listPath}
		>
			<div className={classes.slotheader}>{label}</div>
			{component
				.getSlotProps({
					listName,
					definition,
					path,
					context,
				})
				.map((props, index) => (
					<IndexBuildWrapper key={index} {...props}>
						<IndexComponent {...props} />
					</IndexBuildWrapper>
				))}
		</div>
	)
}

export default IndexSlot
