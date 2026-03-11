"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  domNodes: number;
  memoryUsage?: number;
}

interface PerformanceMonitorProps {
  componentName: string;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export default function PerformanceMonitor({ 
  componentName, 
  onMetricsUpdate 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    domNodes: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    
    // Measure initial load time
    const measureLoadTime = () => {
      const loadTime = performance.now() - startTime;
      const domNodes = document.querySelectorAll('*').length;
      
      const newMetrics: PerformanceMetrics = {
        loadTime: Math.round(loadTime),
        renderTime: Math.round(loadTime), // Approximation for render time
        domNodes,
        memoryUsage: (performance as any).memory?.usedJSHeapSize 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : undefined
      };

      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);

      // Log to console for debugging
      console.log(`🚀 ${componentName} Performance:`, newMetrics);
    };

    // Wait for next frame to measure render time
    requestAnimationFrame(() => {
      requestAnimationFrame(measureLoadTime);
    });

    // Set up performance observer if available
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name.includes(componentName)) {
            console.log(`📊 ${componentName} Measure:`, {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation'] });
      
      return () => observer.disconnect();
    }
  }, [componentName, onMetricsUpdate]);

  // Development-only display
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
        <div className="font-bold text-yellow-400 mb-1">{componentName}</div>
        <div>Load: {metrics.loadTime}ms</div>
        <div>DOM: {metrics.domNodes} nodes</div>
        {metrics.memoryUsage && <div>Memory: {metrics.memoryUsage}MB</div>}
      </div>
    );
  }

  return null;
}
