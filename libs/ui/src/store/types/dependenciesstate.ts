type ConfigValueDependencies = {
	[key: string]: string
}

type ComponentPackDependency = {
	loaded: boolean
}

type ComponentPackDependencies = {
	[key: string]: ComponentPackDependency
}

type Dependencies = {
	configvalues: ConfigValueDependencies
	componentpacks: ComponentPackDependencies
}

export default Dependencies
