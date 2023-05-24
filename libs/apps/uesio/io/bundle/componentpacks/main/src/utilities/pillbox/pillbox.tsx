import { definition, styles } from "@uesio/ui"
import Pill from "./pill"
import TextField from "../field/text"
import { useState } from "react"
import Button from "../button/button"
import Icon from "../icon/icon"

type Props = {
	onSelect?: (value: string) => void
	items: string[]
	onDelete?: (value: string) => void
	onAdd?: (value: string) => void
	addLabel?: string
}

const StyleDefaults = Object.freeze({
	root: ["flex", "items-center", "rounded", "p-2px", "mr-2"],
	remover: [],
	addWrapper: ["p-4"],
})

const PillBox: definition.UtilityComponent<Props> = (props) => {
	const {
		context,
		items,
		onAdd,
		onSelect,
		onDelete,
		addLabel = "Add",
	} = props
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const [showNewItem, setShowNewItem] = useState(false)

	return (
		<div className={classes.root}>
			{items.map((item) => (
				<Pill
					key={item}
					context={context}
					value={item}
					onClick={onSelect}
				>
					{item}
					{onDelete && <span className={classes.remover}>X</span>}
				</Pill>
			))}
			{onAdd && !showNewItem && (
				<div className={classes.addWrapper}>
					<Button
						variant="uesio/builder.panelactionbutton"
						context={context}
						icon={<Icon context={context} icon="add" />}
						label={addLabel}
						onClick={() => setShowNewItem(true)}
					/>
				</div>
			)}
			{onAdd && showNewItem && (
				<TextField
					context={context}
					mode="EDIT"
					focusOnRender
					applyChanges="onBlur"
					setValue={(value: string) => {
						setShowNewItem(false)
						onAdd?.(value)
					}}
				/>
			)}
		</div>
	)
}
PillBox.displayName = "PillBox"

export default PillBox
