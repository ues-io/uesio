package meta

type SiteDomain struct {
	ID        string    `uesio:"uesio/core.id"`
	UniqueKey string    `yaml:"-" uesio:"uesio/core.uniquekey"`
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

func (s *SiteDomain) GetCollectionName() string {
	return s.GetCollection().GetName()
}

func (s *SiteDomain) GetCollection() CollectionableGroup {
	var sdc SiteDomainCollection
	return &sdc
}

func (s *SiteDomain) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

func (s *SiteDomain) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

func (s *SiteDomain) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}

func (s *SiteDomain) Len() int {
	return StandardItemLen(s)
}

func (s *SiteDomain) GetItemMeta() *ItemMeta {
	return s.itemMeta
}

func (s *SiteDomain) SetItemMeta(itemMeta *ItemMeta) {
	s.itemMeta = itemMeta
}
