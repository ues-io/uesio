import React, { ChangeEvent, FunctionComponent } from "react"
import { definition, material, hooks, wire } from "@uesio/ui"
import groupby from "lodash.groupby"
import keyby from "lodash.keyby"

type AddBundleDefinition = {
	installablebundleswire: string
	currentdependencies: string
}

interface Props extends definition.BaseProps {
	definition: AddBundleDefinition
}

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: {},
		card: {
			margin: theme.spacing(1),
		},
	})
)
const setValue = (value: string) => {
	console.log(value)
}
const AddBundle: FunctionComponent<Props> = (props) => {
	const {
		definition: { installablebundleswire, currentdependencies },
		context,
	} = props
	const classes = useStyles(props)

	const uesio = hooks.useUesio(props)

	const bundles = context
		.getWireById(installablebundleswire)
		?.getData()
		.map((record) => {
			const source = record.source
			const namespace = source["uesio.namespace"] as string
			const version = `v${source["uesio.major"]}.${source["uesio.minor"]}.${source["uesio.patch"]}`
			return {
				namespace,
				version,
			}
		})
	const deps = context
		.getWireById(currentdependencies)
		?.getData()
		.map((record) => record.source)
	if (!bundles || !deps) return null
	const bundleGrouping = groupby(bundles, "namespace")
	const bundleNamespaces = Object.keys(bundleGrouping)
	const currentBundleVersions = keyby(
		deps.map((dep) => {
			const bundleInfo = dep["studio.bundle"] as wire.PlainWireRecord
			return {
				namespace: bundleInfo["uesio.namespace"],
				version: `v${bundleInfo["uesio.major"]}.${bundleInfo["uesio.minor"]}.${bundleInfo["uesio.patch"]}`,
			}
		}),
		"namespace"
	)

	return (
		<material.Grid className={classes.root} container={true}>
			{bundleNamespaces.map((namespace) => {
				const versions = bundleGrouping[namespace]
					.map((entry) => entry.version)
					.sort()
					.reverse()
				const installed = !!currentBundleVersions[namespace]
				return (
					<material.Grid
						key={namespace}
						item={true}
						md={3}
						sm={4}
						xs={12}
					>
						<material.Card className={classes.card}>
							<material.CardContent>
								<material.Grid
									className={classes.root}
									container={true}
									alignContent="space-between"
								>
									<material.Grid xs={6} item={true}>
										<h3>{namespace}</h3>
									</material.Grid>
									<material.Grid xs={6} item={true}>
										<div
											style={{
												color: "primary",
												marginTop: "20px",
											}}
										>
											{installed
												? `installed: ${currentBundleVersions[namespace].version}`
												: ""}
										</div>
									</material.Grid>
								</material.Grid>
								<material.TextField
									select={true}
									className={classes.root}
									fullWidth={true}
									InputLabelProps={{
										disableAnimation: true,
										shrink: true,
									}}
									value={
										currentBundleVersions[namespace]
											?.version || versions[0]
									}
									onChange={(
										event: ChangeEvent<HTMLInputElement>
									): void => setValue(event.target.value)}
									size="small"
									label="version"
								>
									{versions.map((option, index) => (
										<material.MenuItem
											key={index}
											value={option}
										>
											{option}
										</material.MenuItem>
									))}
								</material.TextField>
								<div style={{ marginTop: "20px" }}>
									{!installed ? (
										<material.Button
											color="primary"
											variant="contained"
										>
											Install
										</material.Button>
									) : (
										<material.Button
											color="secondary"
											variant="contained"
										>
											Uninstall
										</material.Button>
									)}
								</div>
							</material.CardContent>
						</material.Card>
					</material.Grid>
				)
			})}
		</material.Grid>
	)
}

export default AddBundle
