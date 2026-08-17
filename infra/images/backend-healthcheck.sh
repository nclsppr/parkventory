#!/usr/bin/env bash
set -Eeuo pipefail

exec 3<>/dev/tcp/127.0.0.1/8080
printf 'GET /q/health/ready HTTP/1.0\r\nHost: localhost\r\n\r\n' >&3
grep -Eq '"status"[[:space:]]*:[[:space:]]*"UP"' <&3
