package wire

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"gopkg.in/yaml.v3"
)

func unmarshalOrder(node *yaml.Node) ([]LoadRequestOrder, error) {
	orders := []LoadRequestOrder{}
	orderNode, err := meta.GetMapNode(node, "order")
	if err != nil {
		return orders, nil
	}

	err = orderNode.Decode(&orders)
	if err != nil {
		return nil, err
	}

	return orders, nil
}

type LoadRequestOrder struct {
	Field string `json:"field" bot:"field"`
	Desc  bool   `json:"desc" bot:"desc"`
}
