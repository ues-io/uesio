package postgresio

import (
	"context"
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func (c *Connection) GetRecentMetadata(op *adapt.LoadOp, session *sess.Session) error {

	workspaceID := session.GetWorkspaceID()

	if workspaceID == "" {
		return errors.New("Error getting recent metadata, missing workspace id")
	}

	tenantID := session.GetSiteTenantID()

	if tenantID == "" {
		return errors.New("Error getting recent metadata, missing tenant id")
	}

	metadata := c.metadata
	db := c.GetClient()

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "name",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Name",
	})

	fieldMap, referencedCollections, _, _, err := adapt.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	fieldMap["uesio/core.updatedby"] = &datasource.UPDATEDBY_FIELD_METADATA
	fieldMap["uesio/core.updatedat"] = &datasource.UPDATEDAT_FIELD_METADATA
	fieldMap["uesio/core.collection"] = &datasource.COLLECTION_FIELD_METADATA
	fieldMap["uesio/studio.name"] = &adapt.FieldMetadata{
		Name:       "name",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Name",
	}

	fieldIDs, err := fieldMap.GetUniqueDBFieldNames(getFieldNameWithAlias)
	if err != nil {
		return err
	}

	RECENT_QUERY := "SELECT " + strings.Join(fieldIDs, ",") + " FROM public.data as main WHERE tenant = $1 AND fields->>'uesio/studio.workspace' = $2 ORDER BY updatedat DESC LIMIT 10"

	rows, err := db.Query(context.Background(), RECENT_QUERY, tenantID, workspaceID)
	if err != nil {
		return errors.New("Failed to load rows in PostgreSQL:" + err.Error() + " : " + RECENT_QUERY)
	}
	defer rows.Close()

	var item meta.Item

	scanners := getScanners(&item, rows, fieldMap, &referencedCollections)

	for rows.Next() {

		item = op.Collection.NewItem()

		err := rows.Scan(scanners...)
		if err != nil {
			return err
		}

		err = op.Collection.AddItem(item)
		if err != nil {
			return err
		}

	}
	err = rows.Err()
	if err != nil {
		return err
	}

	return adapt.HandleReferences(c, referencedCollections, session, true)
}
