package meta

type LicensePricingTemplate struct {
	ID           string    `json:"uesio/core.id"`
	UniqueKey    string    `json:"uesio/core.uniquekey"`
	App          *App      `json:"uesio/studio.app"`
	Price        int64     `json:"uesio/studio.price"`
	MetadataType string    `json:"uesio/studio.metadatatype"`
	ActionType   string    `json:"uesio/studio.actiontype"`
	MetadataName string    `json:"uesio/studio.metadataname"`
	itemMeta     *ItemMeta `json:"-"`
	CreatedBy    *User     `json:"uesio/core.createdby"`
	Owner        *User     `json:"uesio/core.owner"`
	UpdatedBy    *User     `json:"uesio/core.updatedby"`
	UpdatedAt    int64     `json:"uesio/core.updatedat"`
	CreatedAt    int64     `json:"uesio/core.createdat"`
}

func (lt *LicensePricingTemplate) GetCollectionName() string {
	return lt.GetCollection().GetName()
}

func (lt *LicensePricingTemplate) GetCollection() CollectionableGroup {
	return &LicensePricingTemplateCollection{}
}

func (lt *LicensePricingTemplate) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(lt, fieldName, value)
}

func (lt *LicensePricingTemplate) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(lt, fieldName)
}

func (lt *LicensePricingTemplate) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(lt, iter)
}

func (lt *LicensePricingTemplate) Len() int {
	return StandardItemLen(lt)
}

func (lt *LicensePricingTemplate) GetItemMeta() *ItemMeta {
	return lt.itemMeta
}

func (lt *LicensePricingTemplate) SetItemMeta(itemMeta *ItemMeta) {
	lt.itemMeta = itemMeta
}
