import React, { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../toolbar/expandpanel/expandpanel"
import PropNodeTag from "../buildpropitem/propnodetag"
import SignalsIcon from "@material-ui/icons/Router"
import { hooks, definition, signal } from "@uesio/ui"
import AddIcon from "@material-ui/icons/AddBox"
import PropertiesPanel from "../toolbar/propertiespanel/propertiespanel"

const SignalsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { section, definition: def, path } = props
	const uesio = hooks.useUesio(props)
	const theme = uesio.getTheme()
	const primaryColor = theme.definition.palette.primary
	const selectedNode = uesio.builder.useSelectedNode()

	const signalsDef = def?.signals as definition.Definition[] | undefined

	return (
		<ExpandPanel
			defaultExpanded={true}
			title={section.title}
			action={AddIcon}
			actionColor={primaryColor}
			actionOnClick={(): void =>
				uesio.view.addDefinition(`${path}["signals"]`, {
					signal: "NEW_SIGNAL",
				})
			}
		>
			{signalsDef?.map((signal: signal.SignalDefinition, index) => {
				const signalPath = `${path}["signals"]["${index}"]`
				const selected = selectedNode.startsWith(signalPath)
				return (
					<PropNodeTag
						title={signal?.signal}
						icon={SignalsIcon}
						selected={selected}
						iconColor={primaryColor}
						key={index}
						onClick={(): void =>
							uesio.builder.setSelectedNode(signalPath)
						}
					>
						<PropertiesPanel
							path={signalPath}
							index={0}
							context={props.context}
							definition={signal}
							propDef={{
								title: "Signal",
								sections: [],
								defaultDefinition: () => ({}),
								properties: uesio.builder.getSignalProperties(
									signal
								),
							}}
						/>
					</PropNodeTag>
				)
			})}
		</ExpandPanel>
	)
}

export default SignalsSection
