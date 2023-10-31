import { definition, component, styles } from "@uesio/ui"
import { SlotDef } from "../../api/stateapi"
import IndexComponent from "./indexcomponent"
import { standardAccepts } from "../../helpers/dragdrop"
import { usePlaceHolders } from "../../utilities/buildwrapper/buildwrapper"

const IndexPlaceHolder: definition.UtilityComponent = (props) => {
	const classes = styles.useUtilityStyleTokens(
		{
			root: [
				"bg-blue-600",
				"py-2",
				"px-3",
				"grid",
				"m-1",
				"rounded-sm",
				"items-center",
			],
		},
		props
	)
	return <div className={classes.root} data-placeholder="true" />
}

const IndexBuildWrapper: definition.UC = (props) => {
	const { children, path, context } = props

	const [addBefore, addAfter, index] = usePlaceHolders(context, path)

	return (
		<div className="contents" data-placeholder="true">
			{addBefore && (
				<IndexPlaceHolder
					label="0"
					isHovering={true}
					context={context}
				/>
			)}
			{children}
			{addAfter && (
				<IndexPlaceHolder
					label={index + 1 + ""}
					isHovering={true}
					context={context}
				/>
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
