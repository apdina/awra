#!/bin/bash

# Monitor API call frequency for /api/current-draw
# Usage: ./scripts/monitor-api-calls.sh

echo "🔍 Monitoring API calls to /api/current-draw"
echo "================================================"
echo "Press Ctrl+C to stop monitoring"
echo ""

LOG_FILE="/tmp/api-monitor.log"
CALL_COUNT=0
START_TIME=$(date +%s)

# Clear any existing log
> "$LOG_FILE"

# Monitor function
monitor_calls() {
    while true; do
        CURRENT_TIME=$(date +%s)
        ELAPSED=$((CURRENT_TIME - START_TIME))
        
        # Count calls in the last minute from Next.js logs
        RECENT_CALLS=$(tail -n 100 /tmp/nextjs.log 2>/dev/null | grep -c "GET /api/current-draw" || echo "0")
        
        if [ "$RECENT_CALLS" -gt 0 ]; then
            CALL_COUNT=$((CALL_COUNT + RECENT_CALLS))
            echo "$(date '+%H:%M:%S') - Detected $RECENT_CALLS API calls (Total: $CALL_COUNT in ${ELAPSED}s)"
            echo "$(date '+%H:%M:%S') - Rate: $(echo "scale=2; $CALL_COUNT * 60 / $ELAPSED" | bc) calls/minute"
        fi
        
        sleep 5
    done
}

# Start monitoring
monitor_calls
