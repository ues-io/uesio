package meta

type SecretStoreValue struct {
	BuiltIn `yaml:",inline"`
	Key     string `json:"uesio/core.key"`
	Value   string `json:"uesio/core.value"`
}

func (s *SecretStoreValue) GetCollectionName() string {
	return SECRETSTOREVALUE_COLLECTION_NAME
}

func (s *SecretStoreValue) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

func (s *SecretStoreValue) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

func (s *SecretStoreValue) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}

func (s *SecretStoreValue) Len() int {
	return StandardItemLen(s)
}
