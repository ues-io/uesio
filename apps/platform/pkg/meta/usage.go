package meta

type Usage struct {
	BuiltIn      `yaml:",inline"`
	Total        int64  `json:"uesio/studio.total"`
	MetadataType string `json:"uesio/studio.metadatatype"`
	ActionType   string `json:"uesio/studio.actiontype"`
	MetadataName string `json:"uesio/studio.metadataname"`
	Day          string `json:"uesio/studio.day"`
	User         string `json:"uesio/studio.user"`
	App          *App   `json:"uesio/studio.app"`
	Site         *Site  `json:"uesio/studio.site"`
}

func (u *Usage) GetCollection() CollectionableGroup {
	return &UsageCollection{}
}

func (u *Usage) GetCollectionName() string {
	return USAGE_COLLECTION_NAME
}

func (u *Usage) SetField(fieldName string, value any) error {
	return StandardFieldSet(u, fieldName, value)
}

func (u *Usage) GetField(fieldName string) (any, error) {
	return StandardFieldGet(u, fieldName)
}

func (u *Usage) Loop(iter func(string, any) error) error {
	return StandardItemLoop(u, iter)
}

func (u *Usage) Len() int {
	return StandardItemLen(u)
}
