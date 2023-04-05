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
