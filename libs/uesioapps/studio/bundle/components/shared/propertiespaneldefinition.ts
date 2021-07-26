import { definition, builder } from "@uesio/ui"

type ValueAdder = (
	path: string | undefined,
	value: definition.Definition,
	index?: number
) => void

type PairAdder = (
	path: string | undefined,
	value: definition.Definition,
	key: string
) => void

type ValueSetter = (
	path: string | undefined,
	value: definition.Definition
) => void

type ValueGetter = (path: string | undefined) => definition.Definition

type ValueRemover = (path: string | undefined) => void

type KeyChanger = (path: string | undefined, key: string) => void

type ValueMover = (
	fromPath: string | undefined,
	toPath: string | undefined
) => void

type ValueAPI = {
	set: ValueSetter
	get: ValueGetter
	add: ValueAdder
	addPair: PairAdder
	remove: ValueRemover
	changeKey: KeyChanger
	move: ValueMover
}

interface PropertiesPaneProps extends definition.UtilityProps {
	propsDef?: builder.BuildPropertiesDefinition | undefined
	valueAPI: ValueAPI
}

export { PropertiesPaneProps, ValueAPI }
