package goutils

import (
	"strings"
	"unicode"
)

func SafeJoinStrings(elems []string, delimiter string) string {
	parts := make([]string, len(elems))
	for i, elem := range elems {
		parts[i] = strings.TrimSuffix(strings.TrimPrefix(elem, delimiter), delimiter)
	}
	return strings.Join(parts, delimiter)
}

func Capitalize(str string) string {
	runes := []rune(str)
	runes[0] = unicode.ToUpper(runes[0])
	return string(runes)
}
