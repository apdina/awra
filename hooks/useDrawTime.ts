import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export function useDrawTime() {
  const config = useQuery(api.systemConfig.getConfig, { key: "default_draw_time" });
  
  if (!config) {
    return null;
  }

  return config.value as string;
}

