package meta

type LicensePricingItem struct {
	ID           string    `json:"uesio/core.id"`
	UniqueKey    string    `json:"uesio/core.uniquekey"`
	App          *App      `json:"uesio/studio.app"`
	License      *License  `json:"uesio/studio.license"`
	Price        float64   `json:"uesio/studio.price"`
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

func (lpi *LicensePricingItem) GetCollectionName() string {
	return lpi.GetCollection().GetName()
}

func (lpi *LicensePricingItem) GetCollection() CollectionableGroup {
	return &LicensePricingItemCollection{}
}

func (lpi *LicensePricingItem) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(lpi, fieldName, value)
}

func (lpi *LicensePricingItem) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(lpi, fieldName)
}

func (lpi *LicensePricingItem) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(lpi, iter)
}

func (lpi *LicensePricingItem) Len() int {
	return StandardItemLen(lpi)
}

func (lpi *LicensePricingItem) GetItemMeta() *ItemMeta {
	return lpi.itemMeta
}

func (lpi *LicensePricingItem) SetItemMeta(itemMeta *ItemMeta) {
	lpi.itemMeta = itemMeta
}
