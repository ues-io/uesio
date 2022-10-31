package meta

type FeatureFlagAssignment struct {
	ID        string    `json:"uesio/core.id"`
	UniqueKey string    `json:"uesio/core.uniquekey"`
	Flag      string    `json:"uesio/core.flag"`
	Value     bool      `json:"uesio/core.value"`
	User      *User     `json:"uesio/core.user"`
	itemMeta  *ItemMeta `json:"-"`
	CreatedBy *User     `json:"uesio/core.createdby"`
	Owner     *User     `json:"uesio/core.owner"`
	UpdatedBy *User     `json:"uesio/core.updatedby"`
	UpdatedAt int64     `json:"uesio/core.updatedat"`
	CreatedAt int64     `json:"uesio/core.createdat"`
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
