package meta

type LicensePricingItem struct {
	BuiltIn      `yaml:",inline"`
	App          *App     `json:"uesio/studio.app"`
	License      *License `json:"uesio/studio.license"`
	Price        float64  `json:"uesio/studio.price"`
	MetadataType string   `json:"uesio/studio.metadatatype"`
	ActionType   string   `json:"uesio/studio.actiontype"`
	MetadataName string   `json:"uesio/studio.metadataname"`
}

func (lpi *LicensePricingItem) GetCollection() CollectionableGroup {
	return &LicensePricingItemCollection{}
}

func (lpi *LicensePricingItem) GetCollectionName() string {
	return LICENSEPRICINGITEM_COLLECTION_NAME
}

func (lpi *LicensePricingItem) SetField(fieldName string, value any) error {
	return StandardFieldSet(lpi, fieldName, value)
}

func (lpi *LicensePricingItem) GetField(fieldName string) (any, error) {
	return StandardFieldGet(lpi, fieldName)
}

func (lpi *LicensePricingItem) Loop(iter func(string, any) error) error {
	return StandardItemLoop(lpi, iter)
}

func (lpi *LicensePricingItem) Len() int {
	return StandardItemLen(lpi)
}
