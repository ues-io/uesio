package meta

type SecretStoreValue struct {
	Key   string `json:"uesio/core.key"`
	Value string `json:"uesio/core.value"`
	BuiltIn
}

func (s *SecretStoreValue) GetCollectionName() string {
	return s.GetCollection().GetName()
}

func (s *SecretStoreValue) GetCollection() CollectionableGroup {
	return &SecretStoreValueCollection{}
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
