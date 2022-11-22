import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { hooks, definition, signal, component } from "@uesio/ui"
import PropertiesPane from "../propertiespane"
import BuildActionsArea from "./buildactionsarea"

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")
const PropNodeTag = component.getUtility("uesio/builder.propnodetag")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

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
				variant="uesio/builder.propsubsection"
				title={""}
				context={context}
				actions={
					<Button
						context={context}
						variant="uesio/builder.actionbutton"
						icon={
							<Icon
								context={context}
								icon="add"
								variant="uesio/builder.actionicon"
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
						<div className="tagroot">{signal?.signal}</div>
						<IOExpandPanel context={context} expanded={selected}>
							<BuildActionsArea
								context={context}
								path={signalPath}
								valueAPI={valueAPI}
								actions={[
									{
										type: "MOVE",
									},
									{
										type: "DELETE",
									},
								]}
							/>
						</IOExpandPanel>
					</PropNodeTag>
				)
			})}
		</>
	)
}

export default SignalsSection
