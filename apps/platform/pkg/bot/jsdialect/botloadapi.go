package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type BotLoadOp struct {
	BatchSize  int                         `bot:"batchsize"`
	Collection string                      `bot:"collection"`
	Fields     []wire.LoadRequestField     `bot:"fields"`
	Conditions []wire.LoadRequestCondition `bot:"conditions"`
	Order      []wire.LoadRequestOrder     `bot:"order"`
	LoadAll    bool                        `bot:"loadAll"`
}
