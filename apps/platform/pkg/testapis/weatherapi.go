package testapis

import (
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"

	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/timeutils"
)

type CurrentWeather struct {
	Temp float64 `json:"temp"`
}

type DailyForecast struct {
	Day  string  `json:"day"`
	Low  float64 `json:"low"`
	High float64 `json:"high"`
	Avg  float64 `json:"avg"`
}

type TempResult struct {
	Current  CurrentWeather  `json:"current"`
	Forecast []DailyForecast `json:"forecast"`
}

func makeRandomDailyForecast(time time.Time) DailyForecast {
	return DailyForecast{
		time.Format(timeutils.ISO8601Date),
		25 + (5 * rand.Float64()),
		35 + (5 * rand.Float64()),
		30 + (5 * rand.Float64()),
	}
}

// This is a sample API for experimentation with Web integration.
// You can expose it by uncommenting this line in serve.go:
// r.HandleFunc("/api/weather", testapis.TestApi).Methods(http.MethodGet, http.MethodPost, http.MethodDelete)
func TestApi(w http.ResponseWriter, r *http.Request) {

	//vars := mux.Vars(r)
	//latitude := vars["lat"]
	//longitude := vars["lng"]

	if r.Method == "POST" {
		input, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "could not read body: "+err.Error(), http.StatusBadRequest)
			return
		} else {
			fmt.Printf("[GOT body] %s \n", string(input))
		}
	}

	filejson.RespondJSON(w, r, &TempResult{
		Current: CurrentWeather{
			Temp: 30 + (10 * rand.Float64()),
		},
		Forecast: []DailyForecast{
			makeRandomDailyForecast(time.Now().AddDate(0, 0, 0)),
			makeRandomDailyForecast(time.Now().AddDate(0, 0, 1)),
			makeRandomDailyForecast(time.Now().AddDate(0, 0, 2)),
			makeRandomDailyForecast(time.Now().AddDate(0, 0, 3)),
			makeRandomDailyForecast(time.Now().AddDate(0, 0, 4)),
			makeRandomDailyForecast(time.Now().AddDate(0, 0, 5)),
			makeRandomDailyForecast(time.Now().AddDate(0, 0, 6)),
		},
	})

}
