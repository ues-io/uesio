package clickup

import (
	"fmt"

	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// GET teams
// https://api.clickup.com/api/v2/team
// TEAM ID: 2569646 --- The Cloud Masters

// GET spaces
// https://api.clickup.com/api/v2/team/{team_id}/space?archived=false
// SPACE ID: 8863869 --- AMAZON Management

// GET folders
// https://api.clickup.com/api/v2/space/{space_id}/folder?archived=false

type ProjectResponse struct {
	Projects []Project `json:"folders"`
}

type Project struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Lists []List `json:"lists"`
}

type List struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func ProjectLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	metadata := connection.GetMetadata()

	collectionMetadata, err := metadata.GetCollection("tcm/timetracker.project")
	if err != nil {
		return err
	}

	spaceID := "8863869"

	url := fmt.Sprintf("space/%s/folder?archived=false", spaceID)

	data := &ProjectResponse{}

	err = integ.ExecByKey(&integ.IntegrationOptions{
		URL:   url,
		Cache: true,
	}, nil, data, "tcm/timetracker.clickup", session)
	if err != nil {
		return err
	}

	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "name",
		Namespace:  "tcm/timetracker",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Name",
	})

	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "lists",
		Namespace:  "tcm/timetracker",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "LIST",
		Label:      "Lists",
		SubType:    "MAP",
		SubFields: map[string]*adapt.FieldMetadata{
			"id": {
				Label: "ID",
				Type:  "TEXT",
			},
			"name": {
				Label: "Name",
				Type:  "TEXT",
			},
		},
	})

	for _, project := range data.Projects {
		opItem := op.Collection.NewItem()
		op.Collection.AddItem(opItem)
		fakeID, _ := shortid.Generate()

		opItem.SetField("uesio/core.id", fakeID)
		opItem.SetField("tcm/timetracker.name", project.Name)
		opItem.SetField("tcm/timetracker.lists", project.Lists)
	}

	return nil

}
