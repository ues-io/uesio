import { definition, styles } from "@uesio/ui"

const StyleDefaults = Object.freeze({
	handle: ["grid", "gap-0.5", "w-2", "content-center", "cursor-grab"],
	handleGrip: ["bg-slate-200", "w-full", "h-[2px]", "rounded-full"],
})

const BuildBarHandle: definition.UtilityComponent = (props) => {
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	return (
		<div className={classes.handle}>
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
			<div className={classes.handleGrip} />
		</div>
	)
}

export default BuildBarHandle
