package systemdialect

import (
	"errors"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type UsageItem adapt.Item

func (i *UsageItem) SetField(fieldName string, value interface{}) error {
	return (*adapt.Item)(i).SetField(strings.Replace(fieldName, "uesio/studio.", "uesio/core.", 1), value)
}

func (i *UsageItem) GetField(fieldName string) (interface{}, error) {
	return (*adapt.Item)(i).GetField(strings.Replace(fieldName, "uesio/studio.", "uesio/core.", 1))
}

func (i *UsageItem) GetFieldAsString(fieldName string) (string, error) {
	return (*adapt.Item)(i).GetFieldAsString(strings.Replace(fieldName, "uesio/studio.", "uesio/core.", 1))
}

func (i *UsageItem) Loop(iter func(string, interface{}) error) error {
	return (*adapt.Item)(i).Loop(iter)
}

func (i *UsageItem) Len() int {
	return (*adapt.Item)(i).Len()
}

type UsageMappingCollection []*UsageItem

func (c *UsageMappingCollection) NewItem() meta.Item {
	return &UsageItem{}
}

func (c *UsageMappingCollection) AddItem(item meta.Item) error {
	*c = append(*c, item.(*UsageItem))
	return nil
}

func (c *UsageMappingCollection) Loop(iter meta.GroupIterator) error {
	for index := range *c {
		err := iter((*c)[index], strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *UsageMappingCollection) Len() int {
	return len(*c)
}

// Gets the conditions from the wire and translates them from core to studio
func mapConditions(coreConditions []adapt.LoadRequestCondition) []adapt.LoadRequestCondition {
	var studioConditions []adapt.LoadRequestCondition
	for _, elem := range coreConditions {
		elem.Field = strings.Replace(elem.Field, "uesio/core.", "uesio/studio.", 1)
		studioConditions = append(studioConditions, elem)
	}
	return studioConditions
}

func mapOrder(coreOrder []adapt.LoadRequestOrder) []adapt.LoadRequestOrder {
	var studioOrder []adapt.LoadRequestOrder
	for _, elem := range coreOrder {
		elem.Field = strings.Replace(elem.Field, "uesio/core.", "uesio/studio.", 1)
		studioOrder = append(studioOrder, elem)
	}
	return studioOrder
}

func runUsageLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	siteAdmin := session.GetSiteAdmin()

	if siteAdmin == nil {
		return errors.New("unable to retrieve usage, site admin context is missing")
	}

	usageData := &UsageMappingCollection{}

	newOp := &adapt.LoadOp{
		CollectionName: "uesio/studio.usage",
		WireName:       "loadStudioUsage",
		View:           op.View,
		Collection:     usageData,
		Conditions: append(mapConditions(op.Conditions), adapt.LoadRequestCondition{
			Field:    "uesio/studio.site",
			Value:    session.GetContextSite().ID,
			Operator: "EQ",
		}),
		Fields: []adapt.LoadRequestField{
			{ID: "uesio/studio.actiontype"},
			{ID: "uesio/studio.app"},
			{ID: "uesio/studio.day"},
			{ID: "uesio/studio.metadataname"},
			{ID: "uesio/studio.metadatatype"},
			{ID: "uesio/studio.site"},
			{ID: "uesio/studio.total"},
			{ID: "uesio/studio.user"},
		},
		Order:          mapOrder(op.Order),
		Query:          true,
		BatchSize:      op.BatchSize,
		LoadAll:        op.LoadAll,
		Params:         op.Params,
		HasMoreBatches: op.HasMoreBatches,
		BatchNumber:    op.BatchNumber,
	}

	_, err := datasource.Load([]*adapt.LoadOp{newOp}, sess.GetStudioAnonSession(), &datasource.LoadOptions{})
	if err != nil {
		return err
	}

	//make sure we pase this back to the original OP
	op.BatchNumber = newOp.BatchNumber
	op.HasMoreBatches = newOp.HasMoreBatches

	metadataResponse := connection.GetMetadata()

	collectionMetadata, err := metadataResponse.GetCollection("uesio/core.usage")
	if err != nil {
		return err
	}

	userFieldMetadata, err := collectionMetadata.GetField("uesio/core.user")
	if err != nil {
		return err
	}

	referencedCollections := adapt.ReferenceRegistry{}
	userCollectionMetadata, err := metadataResponse.GetCollection("uesio/core.user")
	if err != nil {
		return err
	}

	userRefReq := referencedCollections.Get("uesio/core.user")
	userRefReq.Metadata = userCollectionMetadata

	for _, item := range *usageData {
		value, err := item.GetFieldAsString("uesio/core.user")
		if err != nil {
			return err
		}

		userRefReq.AddID(value, adapt.ReferenceLocator{
			Item:  item,
			Field: userFieldMetadata,
		})

		err = op.Collection.AddItem((*adapt.Item)(item))
		if err != nil {
			return err
		}
	}

	//get user refernces with the current site session
	return adapt.HandleReferences(connection, referencedCollections, session, true)

}
