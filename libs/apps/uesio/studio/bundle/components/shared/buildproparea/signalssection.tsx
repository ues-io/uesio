import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import PropNodeTag from "../buildpropitem/propnodetag"
import { hooks, definition, signal, component } from "@uesio/ui"
import PropertiesPane from "../propertiespane"

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")

const SignalsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem, selectedNode] =
		uesio.builder.useSelectedNode()

	const componentDef = valueAPI.get(path || "") as
		| definition.DefinitionMap
		| undefined

	const signalsDef = componentDef?.signals as
		| definition.Definition[]
		| undefined

	const signalsPath = `${path}["signals"]`

	return (
		<>
			<TitleBar
				variant="uesio/studio.propsubsection"
				title={""}
				context={context}
				actions={
					<Button
						context={context}
						variant="uesio/studio.actionbutton"
						icon={
							<Icon
								context={context}
								icon="add"
								variant="uesio/studio.actionicon"
							/>
						}
						label="New Signal"
						onClick={() => {
							valueAPI.add(signalsPath, {
								signal: "NEW_SIGNAL",
							})
						}}
					/>
				}
			/>
			{signalsDef?.map((signal: signal.SignalDefinition, index) => {
				const signalPath = `${signalsPath}["${index}"]`
				const selected = selectedNode.startsWith(signalPath)
				return (
					<PropNodeTag
						selected={selected}
						key={index}
						onClick={(): void =>
							uesio.builder.setSelectedNode(
								metadataType,
								metadataItem,
								signalPath
							)
						}
						context={context}
						popperChildren={
							<PropertiesPane
								path={signalPath}
								index={0}
								context={context}
								propsDef={{
									title: "Signal",
									sections: [],
									defaultDefinition: () => ({}),
									properties:
										uesio.builder.getSignalProperties(
											signal
										),
									actions: [
										{ type: "DELETE" },
										{ type: "MOVE" },
										{ type: "CLONE" },
									],
								}}
								valueAPI={valueAPI}
							/>
						}
					>
						{signal?.signal}
					</PropNodeTag>
				)
			})}
		</>
	)
}

export default SignalsSection
