package meta

type SiteDomain struct {
	BuiltIn `yaml:",inline"`
	Site    *Site  `json:"uesio/studio.site"`
	Type    string `json:"uesio/studio.type"`
	Domain  string `json:"uesio/studio.domain"`
}

func (s *SiteDomain) GetCollection() CollectionableGroup {
	return &SiteDomainCollection{}
}

func (s *SiteDomain) GetCollectionName() string {
	return SITEDOMAIN_COLLECTION_NAME
}

func (s *SiteDomain) SetField(fieldName string, value any) error {
	return StandardFieldSet(s, fieldName, value)
}

func (s *SiteDomain) GetField(fieldName string) (any, error) {
	return StandardFieldGet(s, fieldName)
}

func (s *SiteDomain) Loop(iter func(string, any) error) error {
	return StandardItemLoop(s, iter)
}

func (s *SiteDomain) Len() int {
	return StandardItemLen(s)
}
