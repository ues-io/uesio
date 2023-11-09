package credentials

type EntryMapper func(entry *CredentialEntry) string

type CredentialContainer interface {
	// Map iterates over each entry in the container,
	// and must return a new value for the Entry (modified or not)
	Map(EntryMapper)
	// IsNil returns true if there are no entries in the container
	IsNil() bool
}

type CredentialEntriesMap map[string]*CredentialEntry

func (m *CredentialEntriesMap) Map(mapper EntryMapper) {
	actualMap := *m
	for k, v := range actualMap {
		actualMap[k].Value = mapper(v)
	}
}

func (m *CredentialEntriesMap) IsNil() bool {
	return *m == nil || len(*m) == 0
}

type CredentialEntry struct {
	// Name contains the camel-cased name of the entry, e.g. "clientId".
	// This is not serialized.
	Name string `yaml:"-" json:"-"`
	// Type defines the entry type, one of ["configvalue", "secret", "merge"]
	Type string `yaml:"type" json:"type"`
	// Value contains the entry's source, either a ConfigValue/Secret reference,
	// (which can be resolved at runtime as needed by other code)
	// or a merge containing references to other entry values by name (e.g. "HASH(${apikey})"
	Value string `yaml:"value" json:"value"`
}

func GetEntriesMap(container CredentialContainer) CredentialEntriesMap {
	result := CredentialEntriesMap{}
	container.Map(func(entry *CredentialEntry) string {
		result[entry.Name] = entry
		return entry.Value
	})
	return result
}
