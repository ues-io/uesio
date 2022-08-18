package meta

type FeatureFlagAssignment struct {
	ID        string    `uesio:"uesio/core.id"`
	UniqueKey string    `yaml:"-" uesio:"uesio/core.uniquekey"`
	Flag      string    `uesio:"uesio/core.flag"`
	Value     bool      `uesio:"uesio/core.value"`
	User      string    `uesio:"uesio/core.user"`
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64     `yaml:"-" uesio:"uesio/core.createdat"`
}

func (ffa *FeatureFlagAssignment) GetCollectionName() string {
	return ffa.GetCollection().GetName()
}

func (ffa *FeatureFlagAssignment) GetCollection() CollectionableGroup {
	var ffac FeatureFlagAssignmentCollection
	return &ffac
}

func (ffa *FeatureFlagAssignment) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ffa, fieldName, value)
}

func (ffa *FeatureFlagAssignment) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ffa, fieldName)
}

func (ffa *FeatureFlagAssignment) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ffa, iter)
}

func (ffa *FeatureFlagAssignment) Len() int {
	return StandardItemLen(ffa)
}

func (ffa *FeatureFlagAssignment) GetItemMeta() *ItemMeta {
	return ffa.itemMeta
}

func (ffa *FeatureFlagAssignment) SetItemMeta(itemMeta *ItemMeta) {
	ffa.itemMeta = itemMeta
}
