package logger

import (
	"encoding/json"
	"log"
)

// Entry defines a log entry.
type Entry struct {
	Message  string `json:"message"`
	Severity string `json:"severity,omitempty"`

	// Stackdriver Log Viewer allows filtering and display of this as `jsonPayload.component`.
	Component string `json:"component,omitempty"`
}

const (
	// INFO severity
	INFO = "INFO"
	// ERROR severity
	ERROR = "ERROR"
)

// String renders an entry structure to the JSON format expected by Stackdriver.
func (e Entry) String() string {
	if e.Severity == "" {
		e.Severity = INFO
	}
	out, err := json.Marshal(e)
	if err != nil {
		log.Printf("json.Marshal: %v", err)
	}
	return string(out)
}

func init() {
	// Disable log prefixes such as the default timestamp.
	// Prefix text prevents the message from being parsed as JSON.
	// A timestamp is added when shipping logs to Stackdriver.
	log.SetFlags(0)
}

func Info(message string) {
	Log(message, INFO)
}

func Log(message, severity string) {
	log.Println(Entry{
		Message:  message,
		Severity: severity,
	})
}

func LogError(err error) {
	Log(err.Error(), ERROR)
}
