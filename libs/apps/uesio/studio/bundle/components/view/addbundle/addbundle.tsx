import { FunctionComponent, useState } from "react"
import {
	definition,
	styles,
	wire,
	context,
	hooks,
	component,
	collection,
} from "@uesio/ui"
import groupby from "lodash/groupBy"
import keyby from "lodash/keyBy"

type AddBundleDefinition = {
	installablebundleswire: string
	currentdependencies: string
}

interface Props extends definition.BaseProps {
	definition: AddBundleDefinition
}

const Grid = component.registry.getUtility("uesio/io.grid")
const Tile = component.registry.getUtility("uesio/io.tile")
const Button = component.registry.getUtility("uesio/io.button")
const SelectField = component.registry.getUtility("uesio/io.selectfield")
const TitleBar = component.registry.getUtility("uesio/io.titlebar")

function getRecordByStudioId(id: string, wire: wire.Wire) {
	const records = wire.getData()
	for (const record of records) {
		if (record.source[collection.ID_FIELD] === id) {
			return record
		}
	}
}
async function installBundle(
	namespace: string,
	version: string,
	depWire: wire.Wire,
	workspaceId: string,
	context: context.Context
) {
	depWire.createRecord({
		"uesio/studio.bundle": {
			[collection.ID_FIELD]: `${namespace}_${version}`,
		},
		"uesio/studio.workspace": workspaceId,
	})
	await depWire.save(context)
	return depWire.load(context)
}
function uninstallBundle(
	namespace: string,
	version: string,
	depWire: wire.Wire,
	workspaceId: string,
	context: context.Context
) {
	const record = getRecordByStudioId(
		`${workspaceId}_${namespace}_${version}`,
		depWire
	)
	if (!record) return
	depWire.markRecordForDeletion(record.getId())
	return depWire.save(context)
}
async function updateBundle(
	namespace: string,
	version: string,
	oldVersion: string,
	depWire: wire.Wire,
	workspaceId: string,
	context: context.Context
) {
	const oldRecord = getRecordByStudioId(
		`${workspaceId}_${namespace}_${oldVersion}`,
		depWire
	)

	if (!oldRecord) return
	depWire.markRecordForDeletion(oldRecord.getId())
	return installBundle(namespace, version, depWire, workspaceId, context)
}
const AddBundle: FunctionComponent<Props> = (props) => {
	const {
		definition: { installablebundleswire, currentdependencies },
		context,
	} = props
	const uesio = hooks.useUesio(props)
	const classes = styles.useStyles(
		{
			root: {
				gridTemplateColumns: "1fr 1fr 1fr",
				columnGap: "8px",
			},
		},
		props
	)
	const [selectedValues, setSelectedValues] = useState(
		{} as Record<string, string>
	)
	const depWire = uesio.wire.useWire(currentdependencies || "")
	const route = context.getRoute()
	if (!depWire || !route) return null
	const appName = route.params?.app

	const workspaceId = `${appName}_${route.params?.workspacename}`
	const bundles = uesio.wire
		.useWire(installablebundleswire || "")
		?.getData()
		.map((record) => {
			const namespace = record.getFieldValue(
				"uesio/studio.app->uesio/core.id"
			)
			const major = record.getFieldValue("uesio/studio.major")
			const minor = record.getFieldValue("uesio/studio.minor")
			const patch = record.getFieldValue("uesio/studio.patch")
			// We don't want to see ourselves, uesio or studio
			if (namespace === appName || namespace === "studio") return null
			const version = `v${major}.${minor}.${patch}`
			return { namespace, version }
		})
		.filter((x) => x)

	const deps = depWire.getData()
	if (!bundles || !deps) return null
	const bundleGrouping = groupby(bundles, "namespace")
	const bundleNamespaces = Object.keys(bundleGrouping)
	const currentBundleVersions = keyby(
		deps.map((dep) => {
			const bundleInfo = dep.getFieldValue<wire.PlainWireRecord>(
				"uesio/studio.bundle"
			)
			return {
				namespace: bundleInfo["uesio/studio.app"],
				version: `v${bundleInfo["uesio/studio.major"]}.${bundleInfo["uesio/studio.minor"]}.${bundleInfo["uesio/studio.patch"]}`,
			}
		}),
		"['namespace']['uesio/core.id']"
	)

	return (
		<Grid className={classes.root} context={context}>
			{bundleNamespaces.map((namespace) => {
				const versions = bundleGrouping[namespace]
					.map((entry) => entry?.version)
					.sort()
					.reverse()

				const installed = !!currentBundleVersions[namespace]
				const versionSelected = selectedValues[namespace]
				const installedVersion =
					installed && currentBundleVersions[namespace].version
				const selectedVersion =
					versionSelected ||
					installedVersion ||
					(versions[0] as string)
				const installedIsCurrent = installedVersion === selectedVersion
				let actionButton = (
					<Button
						variant="uesio/io.primary"
						context={context}
						label="Install"
						onClick={() =>
							installBundle(
								namespace,
								selectedVersion,
								depWire,
								workspaceId,
								context
							)
						}
					/>
				)
				if (installed) {
					if (installedIsCurrent) {
						actionButton = (
							<Button
								variant="uesio/io.secondary"
								context={context}
								label="Uninstall"
								onClick={() =>
									uninstallBundle(
										namespace,
										selectedVersion,
										depWire,
										workspaceId,
										context
									)
								}
							/>
						)
					} else {
						actionButton = (
							<Button
								variant="uesio/io.primary"
								context={context}
								label="Update"
								onClick={() =>
									updateBundle(
										namespace,
										selectedVersion,
										installedVersion,
										depWire,
										workspaceId,
										context
									)
								}
							/>
						)
					}
				}
				return (
					<Tile
						key={namespace}
						context={context}
						variant="uesio/io.item"
						styles={{
							root: {
								alignItems: "top",
							},
						}}
					>
						<TitleBar
							context={context}
							title={namespace}
							subtitle={
								installed
									? `installed: ${currentBundleVersions[namespace].version}`
									: ""
							}
						/>
						<SelectField
							context={context}
							value={selectedVersion}
							setValue={(value: string): void => {
								setSelectedValues({
									...selectedValues,
									[namespace]: value,
								})
							}}
							label="version"
							options={versions.map((option, index) => ({
								key: index,
								label: option,
							}))}
						/>
						<div style={{ marginTop: "20px" }}>{actionButton}</div>
					</Tile>
				)
			})}
		</Grid>
	)
}

export default AddBundle
