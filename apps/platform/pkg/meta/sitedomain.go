package meta

// SiteDomain struct
type SiteDomain struct {
	ID        string    `uesio:"uesio/core.id"`
	Site      *Site     `uesio:"uesio/studio.site"`
	Type      string    `uesio:"uesio/studio.type"`
	Domain    string    `uesio:"uesio/studio.domain"`
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64     `yaml:"-" uesio:"uesio/core.createdat"`
}

// GetCollectionName function
func (s *SiteDomain) GetCollectionName() string {
	return s.GetCollection().GetName()
}

// GetCollection function
func (s *SiteDomain) GetCollection() CollectionableGroup {
	var sdc SiteDomainCollection
	return &sdc
}

// SetField function
func (s *SiteDomain) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

// GetField function
func (s *SiteDomain) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

// Loop function
func (s *SiteDomain) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}

// Len function
func (s *SiteDomain) Len() int {
	return StandardItemLen(s)
}

// GetItemMeta function
func (s *SiteDomain) GetItemMeta() *ItemMeta {
	return s.itemMeta
}

// SetItemMeta function
func (s *SiteDomain) SetItemMeta(itemMeta *ItemMeta) {
	s.itemMeta = itemMeta
}
