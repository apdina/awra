import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { 
  getCurrentDrawCache, 
  setCurrentDrawCache,
  getWinningNumbersCache,
  setWinningNumbersCache,
  getDrawCacheVersion,
  setDrawCacheVersion,
  getCache,
  setCache
} from '@/lib/redis-cache';

/**
 * Debug endpoint to test Redis cache operations manually
 * 
 * Usage:
 * GET /api/cache-debug - Shows current cache state
 * POST /api/cache-debug?action=test_write - Tests writing to cache
 * POST /api/cache-debug?action=clear_all - Clears all cache keys
 * POST /api/cache-debug?action=test_current_draw - Tests current draw cache
 */
export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'test_current_draw':
        return await testCurrentDrawCache();
      case 'test_winning_numbers':
        return await testWinningNumbersCache();
      case 'test_generic':
        return await testGenericCache();
      default:
        return await showCacheState();
    }
  } catch (error) {
    logger.error('Cache debug error:', error);
    return NextResponse.json({
      error: 'Cache debug failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'test_write':
        return await testCacheWrite();
      case 'clear_all':
        return await clearAllCache();
      case 'invalidate_current_draw':
        return await invalidateCurrentDraw();
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Cache debug POST error:', error);
    return NextResponse.json({
      error: 'Cache debug POST failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

async function showCacheState() {
  const currentDraw = await getCurrentDrawCache();
  const winningNumbers = await getWinningNumbersCache();
  const drawVersion = await getDrawCacheVersion();

  return NextResponse.json({
    currentDrawCache: {
      exists: currentDraw !== null,
      data: currentDraw,
    },
    winningNumbersCache: {
      exists: winningNumbers !== null,
      data: winningNumbers,
    },
    drawVersion: {
      exists: drawVersion !== null,
      value: drawVersion,
    },
    timestamp: new Date().toISOString(),
  });
}

async function testCurrentDrawCache() {
  const testData = {
    id: 'test-draw-123',
    draw_date: '09/03/2026',
    draw_time: '21:40',
    winning_number: 142,
    is_processed: false,
    test_timestamp: Date.now(),
  };

  // Write test data
  await setCurrentDrawCache(testData);
  
  // Read it back
  const readData = await getCurrentDrawCache();

  return NextResponse.json({
    test: 'current_draw_cache',
    writeData: testData,
    readData: readData,
    success: JSON.stringify(testData) === JSON.stringify(readData),
    timestamp: new Date().toISOString(),
  });
}

async function testWinningNumbersCache() {
  const testData = {
    data: [
      { day: 'Monday', date: '09/03/2026', number: 142 },
      { day: 'Sunday', date: '08/03/2026', number: 89 },
    ],
    pagination: { currentPage: 1, totalPages: 1, totalEntries: 2 },
    test_timestamp: Date.now(),
  };

  // Write test data
  await setWinningNumbersCache(testData);
  
  // Read it back
  const readData = await getWinningNumbersCache();

  return NextResponse.json({
    test: 'winning_numbers_cache',
    writeData: testData,
    readData: readData,
    success: JSON.stringify(testData) === JSON.stringify(readData),
    timestamp: new Date().toISOString(),
  });
}

async function testGenericCache() {
  const testKey = 'test_generic_key';
  const testValue = { message: 'Hello Redis!', timestamp: Date.now() };

  // Write
  await setCache(testKey, testValue, 60);
  
  // Read
  const readValue = await getCache(testKey);

  return NextResponse.json({
    test: 'generic_cache',
    key: testKey,
    writeValue: testValue,
    readValue: readValue,
    success: JSON.stringify(testValue) === JSON.stringify(readValue),
    timestamp: new Date().toISOString(),
  });
}

async function testCacheWrite() {
  const tests = [];
  
  // Test 1: Simple string
  await setCache('test_string', 'hello world', 60);
  tests.push({ type: 'string', success: await getCache('test_string') === 'hello world' });

  // Test 2: Object
  const testObj = { num: 42, str: 'test', arr: [1, 2, 3] };
  await setCache('test_object', testObj, 60);
  tests.push({ type: 'object', success: JSON.stringify(await getCache('test_object')) === JSON.stringify(testObj) });

  // Test 3: Large data
  const largeData = { data: new Array(1000).fill('test').join(' ') };
  await setCache('test_large', largeData, 60);
  tests.push({ type: 'large_data', success: JSON.stringify(await getCache('test_large')) === JSON.stringify(largeData) });

  return NextResponse.json({
    test: 'cache_write_performance',
    results: tests,
    allPassed: tests.every(t => t.success),
    timestamp: new Date().toISOString(),
  });
}

async function clearAllCache() {
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const keys = await redis.keys('*');
  const deleted = await redis.del(...keys);

  return NextResponse.json({
    action: 'clear_all_cache',
    keysDeleted: deleted,
    keysFound: keys.length,
    timestamp: new Date().toISOString(),
  });
}

async function invalidateCurrentDraw() {
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  await redis.del('current_draw');
  await redis.del('current_draw_version');

  return NextResponse.json({
    action: 'invalidate_current_draw',
    success: true,
    timestamp: new Date().toISOString(),
  });
}
