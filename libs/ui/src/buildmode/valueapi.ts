import { Definition } from "../definition/definition"

type ValueAdder = (
	path: string | undefined,
	value: Definition,
	index?: number
) => void

type PairAdder = (
	path: string | undefined,
	value: Definition,
	key: string
) => void

type ValueSetter = (path: string | undefined, value: Definition) => void

type ValueGetter = (path: string | undefined) => Definition

type ValueRemover = (path: string | undefined) => void

type KeyChanger = (path: string | undefined, key: string) => void

type ValueMover = (
	fromPath: string | undefined,
	toPath: string | undefined,
	selectKey?: string
) => void

type ValueCloner = (path: string | undefined) => void

type ValueAPI = {
	set: ValueSetter
	get: ValueGetter
	add: ValueAdder
	addPair: PairAdder
	remove: ValueRemover
	changeKey: KeyChanger
	move: ValueMover
	clone: ValueCloner
}

export default ValueAPI
