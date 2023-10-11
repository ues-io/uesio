package jsdialect

import "github.com/thecloudmasters/uesio/pkg/adapt"

type BotLoadOp struct {
	BatchSize  int                          `bot:"batchsize"`
	Collection string                       `bot:"collection"`
	Fields     []adapt.LoadRequestField     `bot:"fields"`
	Conditions []adapt.LoadRequestCondition `bot:"conditions"`
	Order      []adapt.LoadRequestOrder     `bot:"order"`
	LoadAll    bool                         `bot:"loadAll"`
}
