import React, { ReactElement } from "react"
import { hooks, component } from "@uesio/ui"
import { DeckProps, DeckDefinition } from "./deckdefinition"
import Deck from "./deck"

function DeckBuilder(props: DeckProps): ReactElement {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as DeckDefinition
	const buildView = uesio.builder.useView()
	const isExpanded = buildView === "expandedview"

	const path = props.path
	const context = props.context

	const slotProps = {
		definition,
		listName: "components",
		path,
		accepts: ["uesio.standalone"],
		context: context.addFrame({
			noMerge: true,
		}),
	}
	return (
		<>
			{isExpanded && (
				<div
					style={{
						border: "1px dashed #ccc",
						minHeight: "40px",
						margin: "8px",
						backgroundColor: "#f5f5f5",
					}}
				>
					<component.Slot {...slotProps}></component.Slot>
				</div>
			)}
			<Deck {...props} definition={definition}></Deck>
		</>
	)
}

export default DeckBuilder
