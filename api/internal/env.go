package api

import (
	"os"
	"strings"
)

// LoadEnv reads .env files from common project locations if they exist,
// without overriding any environment variables that are already explicitly set.
func LoadEnv() {
	locations := []string{
		".env",
		"../.env",
		"../db/.env",
		"db/.env",
		"../../db/.env",
	}
	for _, loc := range locations {
		data, err := os.ReadFile(loc)
		if err != nil {
			continue
		}
		lines := strings.Split(string(data), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			line = strings.TrimRight(line, "\r")
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				key = strings.TrimPrefix(key, "export ")
				key = strings.TrimSpace(key)
				val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
				if os.Getenv(key) == "" {
					_ = os.Setenv(key, val)
				}
			}
		}
	}
}
