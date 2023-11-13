package meta

import (
	"fmt"

	"gopkg.in/yaml.v3"
)

type SpecialYaml yaml.Node

func isLocalNamespace(ns, localNamespace string) bool {
	return ns == localNamespace || ns == "this/app"
}

// GetFullyQualifiedKey Takes a possibly localized namespace and turns it into a fully qualified,
// (3rd person) namespace. If the namespace is not local, it is a no-op.
func GetFullyQualifiedKey(itemKey, localNamespace string) string {
	if itemKey == "" {
		return ""
	}
	namespace, name, err := ParseKeyWithDefault(itemKey, localNamespace)
	if err != nil {
		return ""
	}
	if isLocalNamespace(namespace, localNamespace) {
		return fmt.Sprintf("%s.%s", localNamespace, name)
	}
	return itemKey
}

// GetLocalizedKey Takes a possibly fully qualified namespace and turns it into a localized version
func GetLocalizedKey(itemkey, localNamespace string) string {
	if itemkey == "" {
		return ""
	}
	namespace, name, err := ParseKeyWithDefault(itemkey, localNamespace)
	if err != nil {
		return ""
	}
	if isLocalNamespace(namespace, localNamespace) {
		return name
	}
	return itemkey
}

func SwapKeyNamespace(key, from, to string) string {
	return GetFullyQualifiedKey(GetLocalizedKey(key, from), to)
}
