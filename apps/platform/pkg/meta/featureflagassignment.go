package meta

// FeatureFlagAssignment struct
type FeatureFlagAssignment struct {
	ID        string    `uesio:"uesio.id"`
	Key       string    `uesio:"uesio.key"`
	Value     bool      `uesio:"uesio.value"`
	User      string    `uesio:"uesio.user"` //TO-DO check the user type
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `yaml:"-" uesio:"uesio.createdby"`
	Owner     *User     `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy *User     `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt int64     `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt int64     `yaml:"-" uesio:"uesio.createdat"`
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
