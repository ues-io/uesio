package meta

type SiteDomain struct {
	Site   *Site  `json:"uesio/studio.site"`
	Type   string `json:"uesio/studio.type"`
	Domain string `json:"uesio/studio.domain"`
	BuiltIn
}

func (s *SiteDomain) GetCollectionName() string {
	return SITEDOMAIN_COLLECTION_NAME
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
