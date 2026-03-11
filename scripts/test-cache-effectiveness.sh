#!/bin/bash

# Script to test Redis cache effectiveness
# Usage: ./scripts/test-cache-effectiveness.sh

echo "🔍 Testing Redis Cache Effectiveness"
echo "=================================="

BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "info")
            echo -e "ℹ️  $message"
            ;;
    esac
}

# Test 1: Check Redis connection
echo ""
echo "1. Testing Redis Connection..."
redis_status=$(curl -s "$BASE_URL/api/cache-stats" | jq -r '.redisConnected // false')
if [ "$redis_status" = "true" ]; then
    print_status "success" "Redis is connected"
else
    print_status "error" "Redis is not connected"
    exit 1
fi

# Test 2: Check current draw cache
echo ""
echo "2. Testing Current Draw Cache..."
cache_debug=$(curl -s "$BASE_URL/api/cache-debug")
current_draw_exists=$(echo "$cache_debug" | jq -r '.currentDrawCache.exists // false')

if [ "$current_draw_exists" = "true" ]; then
    print_status "success" "Current draw cache exists"
    echo "$cache_debug" | jq '.currentDrawCache.data'
else
    print_status "warning" "Current draw cache is empty"
fi

# Test 3: Test cache write/read performance
echo ""
echo "3. Testing Cache Performance..."
performance_test=$(curl -s "$BASE_URL/api/cache-stats" | jq -r '.performance')
write_time=$(echo "$performance_test" | jq -r '.writeTime // 0')
read_time=$(echo "$performance_test" | jq -r '.readTime // 0')

if [ "$write_time" -lt 1000 ] && [ "$read_time" -lt 1000 ]; then
    print_status "success" "Cache performance is good (write: ${write_time}ms, read: ${read_time}ms)"
else
    print_status "warning" "Cache performance is slow (write: ${write_time}ms, read: ${read_time}ms)"
fi

# Test 4: Test cache hit/miss behavior
echo ""
echo "4. Testing Cache Hit/Miss Behavior..."

# First request - should be cache miss
echo "Making first request (expect cache miss)..."
start_time=$(date +%s%N)
response1=$(curl -s "$BASE_URL/api/current-draw")
end_time=$(date +%s%N)
first_request_time=$(((end_time - start_time) / 1000000))

cache_status1=$(echo "$response1" | jq -r '.id // empty')
if [ -n "$cache_status1" ]; then
    print_status "success" "First request successful (${first_request_time}ms)"
else
    print_status "error" "First request failed"
fi

# Second request - should be cache hit
echo "Making second request (expect cache hit)..."
start_time=$(date +%s%N)
response2=$(curl -s "$BASE_URL/api/current-draw")
end_time=$(date +%s%N)
second_request_time=$(((end_time - start_time) / 1000000))

cache_status2=$(echo "$response2" | jq -r '.id // empty')
if [ -n "$cache_status2" ]; then
    print_status "success" "Second request successful (${second_request_time}ms)"
else
    print_status "error" "Second request failed"
fi

# Compare performance
if [ "$second_request_time" -lt "$first_request_time" ]; then
    improvement=$((first_request_time - second_request_time))
    print_status "success" "Cache is working! ${improvement}ms faster on second request"
else
    print_status "warning" "Cache might not be working effectively"
fi

# Test 5: Load test
echo ""
echo "5. Testing Cache Under Load..."
echo "Making 10 concurrent requests..."

# Create a temporary file for results
temp_file=$(mktemp)

# Make 10 concurrent requests
for i in {1..10}; do
    {
        start_time=$(date +%s%N)
        response=$(curl -s "$BASE_URL/api/current-draw")
        end_time=$(date +%s%N)
        request_time=$(((end_time - start_time) / 1000000))
        success=$(echo "$response" | jq -r '.id // empty')
        echo "$request_time:$success" >> "$temp_file"
    } &
done

# Wait for all requests to complete
wait

# Analyze results
successful_requests=0
total_time=0
while IFS=':' read -r time success; do
    if [ -n "$success" ]; then
        ((successful_requests++))
        total_time=$((total_time + time))
    fi
done < "$temp_file"

avg_time=$((total_time / successful_requests))

if [ "$successful_requests" -eq 10 ]; then
    print_status "success" "All 10 requests successful, avg time: ${avg_time}ms"
else
    print_status "warning" "Only $successful_requests/10 requests successful"
fi

# Clean up
rm -f "$temp_file"

# Test 6: Cache statistics summary
echo ""
echo "6. Cache Statistics Summary"
echo "=========================="
curl -s "$BASE_URL/api/cache-stats" | jq '{
  totalKeys,
  expiredKeys,
  keysWithNoExpiry,
  redisConnected,
  performance: {
    writeTime: .performance.writeTime,
    readTime: .performance.readTime,
    success: .performance.success
  }
}'

echo ""
echo "✨ Cache Effectiveness Test Complete!"
echo ""
echo "Next steps:"
echo "1. Check cache hit rates in production"
echo "2. Monitor Redis usage in Upstash dashboard"
echo "3. Set up alerts for cache misses"
echo "4. Consider cache warming strategies"
