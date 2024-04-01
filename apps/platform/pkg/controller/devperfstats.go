package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/adapt/postgresio"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
)

type PerfStats struct {
	QueryStats postgresio.QueryStatistics `json:"queryStats"`
}

func GetPerfStats(w http.ResponseWriter, r *http.Request) {
	perfStats := PerfStats{
		QueryStats: postgresio.GetQueryStatistics(),
	}
	filejson.RespondJSONPretty(w, r, perfStats)
}

func ResetPerfStats(w http.ResponseWriter, r *http.Request) {
	postgresio.ResetQueryStatistics()
	w.WriteHeader(http.StatusNoContent)
}
