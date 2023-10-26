package credentials

type CredentialContainer interface {
	GetEntriesMap() CredentialEntriesMap
	IsNil() bool
}

type CredentialEntriesMap map[string]*CredentialEntry

type CredentialEntry struct {
	Type  string `yaml:"type" json:"type"`
	Value string `yaml:"value" json:"value"`
}
