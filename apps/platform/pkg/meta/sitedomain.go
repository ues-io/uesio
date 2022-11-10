package meta

type SiteDomain struct {
	ID        string    `json:"uesio/core.id"`
	UniqueKey string    `json:"uesio/core.uniquekey"`
	Site      *Site     `json:"uesio/studio.site"`
	Type      string    `json:"uesio/studio.type"`
	Domain    string    `json:"uesio/studio.domain"`
	itemMeta  *ItemMeta `json:"-"`
	CreatedBy *User     `json:"uesio/core.createdby"`
	Owner     *User     `json:"uesio/core.owner"`
	UpdatedBy *User     `json:"uesio/core.updatedby"`
	UpdatedAt int64     `json:"uesio/core.updatedat"`
	CreatedAt int64     `json:"uesio/core.createdat"`
}

func (s *SiteDomain) GetCollectionName() string {
	return s.GetCollection().GetName()
}

func (s *SiteDomain) GetCollection() CollectionableGroup {
	return &SiteDomainCollection{}
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
