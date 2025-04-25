package meta

type FeatureFlagAssignment struct {
	BuiltIn `yaml:",inline"`
	Flag    string `json:"uesio/core.flag"`
	Value   any    `json:"uesio/core.value"`
	User    *User  `json:"uesio/core.user"`
}

func (ffa *FeatureFlagAssignment) GetCollection() CollectionableGroup {
	return &FeatureFlagAssignmentCollection{}
}

func (ffa *FeatureFlagAssignment) GetCollectionName() string {
	return FEATUREFLAGASSIGNMENT_COLLECTION_NAME
}

func (ffa *FeatureFlagAssignment) SetField(fieldName string, value any) error {
	return StandardFieldSet(ffa, fieldName, value)
}

func (ffa *FeatureFlagAssignment) GetField(fieldName string) (any, error) {
	return StandardFieldGet(ffa, fieldName)
}

func (ffa *FeatureFlagAssignment) Loop(iter func(string, any) error) error {
	return StandardItemLoop(ffa, iter)
}

func (ffa *FeatureFlagAssignment) Len() int {
	return StandardItemLen(ffa)
}
