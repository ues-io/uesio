package goutils

// MapKeys returns a slice of keys of an input map
func MapKeys[K comparable, V any](inputMap map[K]V) []K {
	keys := make([]K, len(inputMap))
	i := 0
	for k := range inputMap {
		keys[i] = k
		i++
	}
	return keys
}

// MapValues returns a slice of values of an input map
func MapValues[K comparable, V any](inputMap map[K]V) []V {
	values := make([]V, len(inputMap))
	i := 0
	for _, v := range inputMap {
		values[i] = v
		i++
	}
	return values
}
