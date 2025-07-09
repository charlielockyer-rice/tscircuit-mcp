import { describe, it, expect } from 'bun:test';
import { TscircuitMCPServer } from './server.js';

describe('TscircuitMCPServer', () => {
  it('should create a server instance', () => {
    const server = new TscircuitMCPServer();
    expect(server).toBeDefined();
    expect(server.getAPI()).toBeDefined();
  });

  it('should search for packages', async () => {
    const server = new TscircuitMCPServer();
    const api = server.getAPI();
    
    const results = await api.searchPackages({ 
      query: 'led', 
      limit: 2 
    });
    
    expect(results.objects).toBeDefined();
    expect(results.objects.length).toBeGreaterThan(0);
    expect(results.objects[0].package.name).toBeDefined();
  });
});