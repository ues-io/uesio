package meta

// FeatureFlagAssignment struct
type FeatureFlagAssignment struct {
	ID        string    `uesio:"uesio/core.id"`
	Key       string    `uesio:"uesio/core.key"`
	Value     bool      `uesio:"uesio/core.value"`
	User      string    `uesio:"uesio/core.user"`
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64     `yaml:"-" uesio:"uesio/core.createdat"`
}

// GetCollectionName function
func (ffa *FeatureFlagAssignment) GetCollectionName() string {
	return ffa.GetCollection().GetName()
}

// GetCollection function
func (ffa *FeatureFlagAssignment) GetCollection() CollectionableGroup {
	var ffac FeatureFlagAssignmentCollection
	return &ffac
}

// SetField function
func (ffa *FeatureFlagAssignment) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ffa, fieldName, value)
}

// GetField function
func (ffa *FeatureFlagAssignment) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ffa, fieldName)
}

// Loop function
func (ffa *FeatureFlagAssignment) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ffa, iter)
}

// Len function
func (ffa *FeatureFlagAssignment) Len() int {
	return StandardItemLen(ffa)
}

// GetItemMeta function
func (ffa *FeatureFlagAssignment) GetItemMeta() *ItemMeta {
	return ffa.itemMeta
}

// SetItemMeta function
func (ffa *FeatureFlagAssignment) SetItemMeta(itemMeta *ItemMeta) {
	ffa.itemMeta = itemMeta
}
