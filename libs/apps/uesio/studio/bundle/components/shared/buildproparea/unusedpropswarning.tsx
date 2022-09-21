import React, { FC } from "react"
import names from "./names"
import PropNodeTag from "../buildpropitem/propnodetag"

import { definition, builder, component, context } from "@uesio/ui"

interface T extends definition.BaseProps {
	propertiesToRender: builder.PropDescriptor[]
	propsDef: builder.BuildPropertiesDefinition
	valueAPI: builder.ValueAPI
	context: context.Context
}

const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
const Icon = component.getUtility("uesio/io.icon")

const UnusedPropsWarning: FC<T> = (props) => {
	const { propsDef, propertiesToRender, context, path, valueAPI } = props
	const [expanded, setExpanded] = React.useState(false)

	const values = valueAPI.get(path) as definition.DefinitionMap

	// Get the keys we allow from other sections
	const keysFromSections = propsDef.sections.flatMap((s) => {
		if (s.type === "CUSTOM") return s.names
		return "name" in s ? s.name : names[s.type]
	})

	const keysToSet = propertiesToRender.map((x) => x.name)
	const keyToAllow = [...keysToSet, ...keysFromSections]
	// get the keys we have
	const keysAlreadySet = Object.keys(values || {})
	// Identify unused keys
	const unused = keysAlreadySet.filter((k) => !keyToAllow.includes(k))
	return unused.length ? (
		<PropNodeTag onClick={() => setExpanded(!expanded)} context={context}>
			<div
				style={{
					fontSize: "0.9em",
					padding: "8px",
					color: "#666666",
				}}
			>
				<div
					style={{
						display: "flex",
						gap: "5px",
						alignItems: "center",
					}}
				>
					<Icon icon="error" context={context} />
					<span>Found unused property values</span>
					<div
						style={{
							display: "inline",
							marginLeft: "auto",
						}}
					>
						<Icon
							icon={`expand_${expanded ? "less" : "more"}`}
							context={context}
						/>
					</div>
				</div>
				<IOExpandPanel context={context} expanded={expanded}>
					<div style={{ paddingTop: "8px" }}>
						{unused.map((el) => (
							<PropNodeTag
								key={el}
								onClick={(e: MouseEvent) => {
									e.stopPropagation()
									valueAPI.remove(path + `["${el}"]`)
								}}
								context={context}
								variant="uesio/studio.smallpropnodetag"
							>
								<Icon icon="close" context={context} />
								<span>{el}</span>
							</PropNodeTag>
						))}
					</div>
				</IOExpandPanel>
			</div>
		</PropNodeTag>
	) : null
}

export default UnusedPropsWarning
