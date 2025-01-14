import { definition, context, styles } from "@uesio/ui"
import PlaceHolder from "../placeholder/placeholder"
import { useDropPath } from "../../api/stateapi"
import { FullPath } from "../../api/path"

const StyleDefaults = Object.freeze({
	root: ["contents", "relative"],
})

const markerClasses = [
	"empty:before:content-['']",
	"empty:before:block",
	["empty:before", "[&>:first-child]"].flatMap((selector) =>
		[
			"min-h-[1.25rem]",
			"outline-dashed",
			"outline-slate-300",
			"outline-1",
		].map((cls) => `${selector}:${cls}`)
	),
]

const usePlaceHolders = (
	context: context.Context,
	path: string
): [boolean, boolean, number] => {
	const dropPath = useDropPath(context)

	const viewDefId = context.getViewDefId()
	const fullPath = new FullPath("viewdef", viewDefId, path)

	const [, index, slotPath] = fullPath.popIndexAndType()

	let addBefore = false,
		addAfter = false

	if (dropPath.isSet() && dropPath.size() > 1) {
		const [dropIndex, dropSlotPath] = dropPath.popIndex()
		const isDroppingInMySlot = slotPath.equals(dropSlotPath)
		if (isDroppingInMySlot) {
			if (index === 0 && dropIndex === 0) addBefore = true
			if (dropIndex === index + 1) addAfter = true
		}
	}

	return [addBefore, addAfter, index]
}

const BuildWrapper: definition.UC = (props) => {
	const { children, path, context, componentType } = props

	const [addBefore, addAfter, index] = usePlaceHolders(context, path)

	const classes = styles.useStyleTokens(StyleDefaults, props)
	const markerStyle = styles.shortcut("marker", markerClasses)

	return (
		<div
			className={styles.cx(classes.root, markerStyle)}
			data-placeholder="true"
			data-index={index}
			data-component={componentType}
		>
			{addBefore && (
				<PlaceHolder label="0" isHovering={true} context={context} />
			)}
			{children}
			{addAfter && (
				<PlaceHolder
					label={index + 1 + ""}
					isHovering={true}
					context={context}
				/>
			)}
		</div>
	)
}

export { usePlaceHolders }

export default BuildWrapper
