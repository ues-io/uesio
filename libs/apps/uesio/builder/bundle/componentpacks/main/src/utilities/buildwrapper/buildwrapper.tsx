import { definition, context, styles } from "@uesio/ui"
import PlaceHolder from "../placeholder/placeholder"
import { useDropPath } from "../../api/stateapi"
import { FullPath } from "../../api/path"

const StyleDefaults = Object.freeze({
	root: [
		"contents",
		"relative",
		"empty:block",
		"empty:bg-blue-50",
		"empty:py-2",
		"empty:px-4",
		"empty:my-1",
		"empty:border-1",
		"empty:border-blue-400",
		"empty:text-blue-400",
		"empty:text-[8pt]",
		"empty:font-light",
		"empty:rounded",
		"empty:uppercase",
		"empty:before:block",
		"empty:before:pl-6",
		"empty:before:content-[attr(data-component)]",
		"empty:after:absolute",
		"empty:after:inset-0",
		"empty:after:pointer-events-none",
		"empty:after:content-['visibility\\_off']",
		"empty:after:py-1",
		"empty:after:px-3",
		"empty:after:font-[Material_Icons]",
		"empty:after:text-base",
	],
})

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

	return (
		<div
			className={classes.root}
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
