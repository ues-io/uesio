package bot

type BotResponse struct {
	Params  map[string]any `json:"params"`
	Success bool           `json:"success"`
	Error   string         `json:"error"`
}
