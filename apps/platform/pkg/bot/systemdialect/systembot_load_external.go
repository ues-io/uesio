package systemdialect

import (
	"fmt"
	"net/url"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/bot/jsdialect"
	botutils "github.com/thecloudmasters/uesio/pkg/bot/utils"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type SimpleResponse struct {
	Data wire.Collection `json:"data"`
}

type SimpleResponseBatch struct {
	Wires []*SimpleResponse
}

func differentHostLoad(op *wire.LoadOp, session *sess.Session) error {

	integrationConnection, err := op.GetIntegrationConnection()
	if err != nil {
		return err
	}

	baseUrl, err := botutils.GetBaseURL(integrationConnection, session)
	if err != nil {
		return err
	}

	botAPI := jsdialect.NewBotHttpAPI(integrationConnection)

	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}

	loadOp, err := getLoadOp(op, collectionMetadata)
	if err != nil {
		return err
	}

	responseBody := &SimpleResponseBatch{}

	response := botAPI.Request(&jsdialect.BotHttpRequest{
		URL:    baseUrl + "/site/wires/load",
		Method: "POST",
		Body: wire.LoadRequestBatch{
			Wires: []*wire.LoadOp{
				loadOp,
			},
		},
		ResponseBody: responseBody,
	})

	if response.Code != 200 {
		return fmt.Errorf("external load failed: %s, %v, %s", baseUrl, response.Code, response.Status)
	}

	return addDataToCollection(op, collectionMetadata, &responseBody.Wires[0].Data)

}

func addDataToCollection(op *wire.LoadOp, collectionMetadata *wire.CollectionMetadata, externalData meta.Group) error {
	externalFieldMap := collectionMetadata.GetExternalFieldMap()

	return externalData.Loop(func(item meta.Item, index string) error {
		newItem := op.Collection.NewItem()
		err := item.Loop(func(s string, i any) error {
			fieldMetadata := externalFieldMap[s]
			fieldName := s
			if fieldMetadata != nil {
				fieldName = fieldMetadata.GetFullName()
			}
			return newItem.SetField(fieldName, i)
		})
		if err != nil {
			return err
		}
		return op.Collection.AddItem(newItem)
	})
}

func getOrder(op *wire.LoadOp, collectionMetadata *wire.CollectionMetadata) ([]wire.LoadRequestOrder, error) {
	loadOrders := []wire.LoadRequestOrder{}

	for _, order := range op.Order {

		fieldMetadata, err := collectionMetadata.GetField(order.Field)
		if err != nil {
			return nil, err
		}
		externalFieldName := fieldMetadata.GetExternalFieldName()
		if externalFieldName == "" {
			externalFieldName = order.Field
		}

		loadOrders = append(loadOrders, wire.LoadRequestOrder{
			Field: externalFieldName,
			Desc:  order.Desc,
		})
	}
	return loadOrders, nil
}

func getFields(op *wire.LoadOp, collectionMetadata *wire.CollectionMetadata) ([]wire.LoadRequestField, error) {
	loadFields := []wire.LoadRequestField{}

	for _, field := range op.Fields {

		fieldMetadata, err := collectionMetadata.GetField(field.ID)
		if err != nil {
			return nil, err
		}
		externalFieldName := fieldMetadata.GetExternalFieldName()
		if externalFieldName == "" {
			externalFieldName = field.ID
		}

		loadFields = append(loadFields, wire.LoadRequestField{
			ID: externalFieldName,
		})
	}
	return loadFields, nil
}

func getConditions(op *wire.LoadOp, collectionMetadata *wire.CollectionMetadata) ([]wire.LoadRequestCondition, error) {
	loadConditions := []wire.LoadRequestCondition{}

	for _, condition := range op.Conditions {

		fieldMetadata, err := collectionMetadata.GetField(condition.Field)
		if err != nil {
			return nil, err
		}

		// Clone the condition
		conditionClone := condition

		externalFieldName := fieldMetadata.GetExternalFieldName()
		if externalFieldName != "" {
			conditionClone.Field = externalFieldName
		}

		loadConditions = append(loadConditions, conditionClone)
	}
	return loadConditions, nil
}

func getLoadOp(op *wire.LoadOp, collectionMetadata *wire.CollectionMetadata) (*wire.LoadOp, error) {
	loadFields, err := getFields(op, collectionMetadata)
	if err != nil {
		return nil, err
	}
	loadConditions, err := getConditions(op, collectionMetadata)
	if err != nil {
		return nil, err
	}
	loadOrder, err := getOrder(op, collectionMetadata)
	if err != nil {
		return nil, err
	}
	return &wire.LoadOp{
		CollectionName: collectionMetadata.TableName,
		WireName:       op.WireName,
		Conditions:     loadConditions,
		BatchSize:      op.BatchSize,
		Fields:         loadFields,
		Order:          loadOrder,
		Query:          true,
	}, nil
}

func sameHostLoad(op *wire.LoadOp, connection wire.Connection, site *meta.Site, session *sess.Session) error {
	// Now get a public session
	publicSession, err := auth.GetPublicSession(session.Context(), site, connection)
	if err != nil {
		return err
	}

	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}

	loadOp, err := getLoadOp(op, collectionMetadata)
	if err != nil {
		return err
	}

	loadOp.Collection = &wire.Collection{}

	err = datasource.LoadWithError(loadOp, publicSession, nil)
	if err != nil {
		return err
	}

	return addDataToCollection(op, collectionMetadata, loadOp.Collection)

}

func runUesioExternalLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {
	integrationConnection, err := op.GetIntegrationConnection()
	if err != nil {
		return err
	}

	baseUrl, err := botutils.GetBaseURL(integrationConnection, session)
	if err != nil {
		return err
	}

	parsedBaseUrl, err := url.Parse(baseUrl)
	if err != nil {
		return err
	}

	site, err := auth.GetSiteFromHost(parsedBaseUrl.Host)
	if err != nil {
		return differentHostLoad(op, session)
	}

	return sameHostLoad(op, connection, site, session)

}
