import { definition, component, styles } from "@uesio/ui"
import { SlotDef } from "../../api/stateapi"
import IndexComponent from "./indexcomponent"
import { standardAccepts } from "../../helpers/dragdrop"
import { usePlaceHolders } from "../../utilities/buildwrapper/buildwrapper"

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
} & definition.BaseProps

const IndexSlot: definition.UtilityComponent<IndexSlotProps> = (props) => {
	const { context, slot, path, definition } = props
	const listName = slot.name

	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`

	if (!definition) return null

	return (
		<div data-accepts={standardAccepts.join(",")} data-path={listPath}>
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
