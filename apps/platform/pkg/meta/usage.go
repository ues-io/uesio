package meta

type Usage struct {
	ID           string    `json:"uesio/core.id"`
	UniqueKey    string    `json:"uesio/core.uniquekey"`
	Total        int64     `json:"uesio/core.total"`
	MetadataType string    `json:"uesio/core.metadatatype"`
	ActionType   string    `json:"uesio/core.actiontype"`
	MetadataName string    `json:"uesio/core.metadataname"`
	Day          string    `json:"uesio/core.day"`
	User         *User     `json:"uesio/core.user"`
	itemMeta     *ItemMeta `json:"-"`
	CreatedBy    *User     `json:"uesio/core.createdby"`
	Owner        *User     `json:"uesio/core.owner"`
	UpdatedBy    *User     `json:"uesio/core.updatedby"`
	UpdatedAt    int64     `json:"uesio/core.updatedat"`
	CreatedAt    int64     `json:"uesio/core.createdat"`
}

func (u *Usage) GetCollectionName() string {
	return u.GetCollection().GetName()
}

func (u *Usage) GetCollection() CollectionableGroup {
	return &UsageCollection{}
}

func (u *Usage) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(u, fieldName, value)
}

func (u *Usage) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(u, fieldName)
}

func (u *Usage) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(u, iter)
}

func (u *Usage) Len() int {
	return StandardItemLen(u)
}

func (u *Usage) GetItemMeta() *ItemMeta {
	return u.itemMeta
}

func (u *Usage) SetItemMeta(itemMeta *ItemMeta) {
	u.itemMeta = itemMeta
}
