package clickup

import (
	"errors"
	"fmt"

	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type TaskResponse struct {
	Tasks []Task `json:"tasks"`
}

type Task struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	CustomFields []CustomField `json:"custom_fields"`
	StartDate    int64         `json:"start_date,string"`
	DueDate      int64         `json:"due_date,string"`
	Status       *Status       `json:"status"`
}

type Status struct {
	Status string `json:"status"`
	Color  string `json:"color"`
}

type CustomField struct {
	ID         string      `json:"id"`
	Name       string      `json:"name"`
	Value      interface{} `json:"value"`
	TypeConfig TypeConfig  `json:"type_config"`
}

type TypeConfig struct {
	Options []TypeConfigOptions `json:"options"`
}

type TypeConfigOptions struct {
	Name       string      `json:"name"`
	OrderIndex interface{} `json:"orderindex"`
}

func TaskLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	metadata := connection.GetMetadata()

	collectionMetadata, err := metadata.GetCollection("tcm/timetracker.task")
	if err != nil {
		return err
	}

	// Verify that a type condition was provided
	if op.Conditions == nil || len(op.Conditions) != 1 {
		return errors.New("Tasks can only be queried by task ID or list ID")
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

	condition := op.Conditions[0]
	value := condition.Value
	if value == "" || value == nil {
		return nil
	}

	data := &TaskResponse{}

	if condition.Field == "tcm/timetracker.id" {
		url := fmt.Sprintf("task/%v?include_subtasks=false", value)
		ldata := &Task{}
		err = integ.ExecByKey(&integ.IntegrationOptions{
			URL:   url,
			Cache: true,
		}, nil, ldata, "tcm/timetracker.clickup", session)
		if err != nil {
			return err
		}
		data.Tasks = append(data.Tasks, *ldata)
	}

	if condition.Field == "tcm/timetracker.list" {
		url := fmt.Sprintf("list/%v/task?archived=false&page=0&subtasks=false", value)
		err = integ.ExecByKey(&integ.IntegrationOptions{
			URL:   url,
			Cache: true,
		}, nil, data, "tcm/timetracker.clickup", session)
		if err != nil {
			return err
		}
	}

	for _, task := range data.Tasks {

		opItem := op.Collection.NewItem()
		op.Collection.AddItem(opItem)
		fakeID, _ := shortid.Generate()

		opItem.SetField("uesio/core.id", fakeID)
		opItem.SetField("tcm/timetracker.id", task.ID)
		opItem.SetField("tcm/timetracker.name", task.Name)
		opItem.SetField("tcm/timetracker.startdate", task.StartDate/1000)
		opItem.SetField("tcm/timetracker.duedate", task.DueDate/1000)
		if task.Status != nil {
			opItem.SetField("tcm/timetracker.status", task.Status.Status)
			opItem.SetField("tcm/timetracker.statuscolor", task.Status.Color)
		}

		for _, field := range task.CustomFields {
			if field.Name == "Customer Team" {
				for _, option := range field.TypeConfig.Options {

					if option.OrderIndex == field.Value {
						opItem.SetField("tcm/timetracker.customerteam", option.Name)
					}
				}
			}
		}

	}

	return nil

}
