// Node.js v18+ has built-in fetch, no import needed
import {
  RegistrySearchResponse,
  PackageDetails,
  SearchComponentsParams,
  GetPackageDetailsParams,
  GetPackageCodeParams,
  AnalyzeComponentParams,
  ErrorResponse,
  CacheEntry,
  ComponentCategory
} from './types.js';

const REGISTRY_BASE_URL = 'https://registry-api.tscircuit.com';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 10000; // 10 seconds

class TscircuitAPI {
  private cache = new Map<string, CacheEntry<any>>();

  private async fetchWithTimeout(url: string, options: any = {}, timeout: number = REQUEST_TIMEOUT): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'tscircuit-mcp/1.0.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  async searchPackages(params: SearchComponentsParams): Promise<RegistrySearchResponse> {
    const cacheKey = this.getCacheKey('search', params);
    const cached = this.getFromCache<RegistrySearchResponse>(cacheKey);
    if (cached) return cached;

    const url = `${REGISTRY_BASE_URL}/packages/search`;
    
    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({ query: params.query })
      }, REQUEST_TIMEOUT);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (!responseData.ok) {
        throw new Error(`Search failed: ${responseData.error?.message || 'Unknown error'}`);
      }
      
      // Transform tscircuit API response to match expected format
      const tscircuitPackages = responseData.packages || [];
      
      // Filter by category if specified
      let filteredPackages = tscircuitPackages;
      if (params.category) {
        filteredPackages = tscircuitPackages.filter((pkg: any) => 
          pkg.name?.toLowerCase().includes(params.category!.toLowerCase()) ||
          pkg.description?.toLowerCase().includes(params.category!.toLowerCase()) ||
          pkg.ai_description?.toLowerCase().includes(params.category!.toLowerCase())
        );
      }
      
      // Apply limit
      if (params.limit) {
        filteredPackages = filteredPackages.slice(0, params.limit);
      }
      
      // Transform to expected format
      const transformedData: RegistrySearchResponse = {
        objects: filteredPackages.map((pkg: any) => ({
          package: {
            name: pkg.name,
            version: pkg.latest_version,
            description: pkg.description || pkg.ai_description || '',
            keywords: [], // tscircuit API doesn't return keywords in search
            links: {
              npm: `https://www.npmjs.com/package/@tsci/${pkg.name}`,
              homepage: pkg.website || undefined,
              repository: pkg.website || undefined
            }
          },
          score: {
            final: pkg.star_count || 0,
            detail: {
              quality: 1,
              popularity: pkg.star_count || 0,
              maintenance: 1
            }
          }
        })),
        total: filteredPackages.length,
        time: new Date().toISOString()
      };
      
      this.setCache(cacheKey, transformedData);
      return transformedData;
    } catch (error) {
      throw new Error(`Failed to search packages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPackageDetails(params: GetPackageDetailsParams): Promise<PackageDetails> {
    const cacheKey = this.getCacheKey('package', params);
    const cached = this.getFromCache<PackageDetails>(cacheKey);
    if (cached) return cached;

    // For now, search for the package to get its details since there's no direct package endpoint
    const searchResult = await this.searchPackages({ query: params.packageName, limit: 50 });
    
    const exactMatch = searchResult.objects.find(obj => 
      obj.package.name === params.packageName ||
      obj.package.name.endsWith(`/${params.packageName}`) ||
      obj.package.name.includes(params.packageName)
    );
    
    if (!exactMatch) {
      throw new Error(`Package "${params.packageName}" not found`);
    }

    // Transform to PackageDetails format
    const packageDetails: PackageDetails = {
      name: exactMatch.package.name,
      version: exactMatch.package.version,
      description: exactMatch.package.description,
      keywords: exactMatch.package.keywords,
      links: exactMatch.package.links,
      // Add some additional fields that might be useful
      versions: [exactMatch.package.version],
      license: 'unset', // tscircuit packages typically don't set license
      downloads: {
        weekly: 0,
        monthly: 0
      }
    };

    this.setCache(cacheKey, packageDetails);
    return packageDetails;
  }

  async getPackageCode(params: GetPackageCodeParams): Promise<string> {
    const cacheKey = this.getCacheKey('code', params);
    const cached = this.getFromCache<string>(cacheKey);
    if (cached) return cached;

    try {
      // First, list the files in the package
      const listUrl = `${REGISTRY_BASE_URL}/package_files/list`;
      
      const listResponse = await this.fetchWithTimeout(listUrl, {
        method: 'POST',
        body: JSON.stringify({
          package_name: params.packageName,
          use_latest_version: true
        })
      }, REQUEST_TIMEOUT);
      
      if (!listResponse.ok) {
        throw new Error(`Failed to list package files: ${listResponse.status} ${listResponse.statusText}`);
      }
      
      const listData = await listResponse.json();
      
      if (!listData.ok) {
        throw new Error(`Failed to list package files: ${listData.error?.message || 'Unknown error'}`);
      }
      
      // Find the index.tsx file (main component file)
      const indexFile = listData.package_files?.find((file: any) => 
        file.file_path === 'index.tsx' || 
        file.file_path === 'index.ts' || 
        file.file_path === 'src/index.tsx' || 
        file.file_path === 'src/index.ts'
      );
      
      if (!indexFile) {
        throw new Error(`No index file found in package "${params.packageName}"`);
      }
      
      // Download the index file
      const downloadUrl = `${REGISTRY_BASE_URL}/package_files/download?package_file_id=${indexFile.package_file_id}`;
      
      const downloadResponse = await this.fetchWithTimeout(downloadUrl, {
        method: 'GET'
      }, REQUEST_TIMEOUT);
      
      if (!downloadResponse.ok) {
        throw new Error(`Failed to download package file: ${downloadResponse.status} ${downloadResponse.statusText}`);
      }
      
      const code = await downloadResponse.text();
      
      if (!code) {
        throw new Error(`No code found in package "${params.packageName}"`);
      }
      
      this.setCache(cacheKey, code);
      return code;
    } catch (error) {
      throw new Error(`Failed to fetch package code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeComponent(params: AnalyzeComponentParams): Promise<any> {
    const packageDetails = await this.getPackageDetails({ packageName: params.packageName });
    
    // Extract component analysis from package metadata
    const analysis = {
      name: packageDetails.name,
      description: packageDetails.description,
      category: this.inferCategory(packageDetails),
      specifications: packageDetails.tscircuit?.specifications || {},
      footprint: packageDetails.tscircuit?.footprint,
      keywords: packageDetails.keywords || [],
      repository: packageDetails.links?.repository,
      npm: packageDetails.links?.npm,
      version: packageDetails.version,
      license: packageDetails.license,
      dependencies: packageDetails.dependencies || {},
      estimated_specs: this.extractSpecsFromDescription(packageDetails.description, packageDetails.keywords || [])
    };

    return analysis;
  }

  private inferCategory(pkg: PackageDetails): ComponentCategory {
    const keywords = pkg.keywords || [];
    const description = pkg.description?.toLowerCase() || '';
    const name = pkg.name.toLowerCase();

    // Check explicit category from tscircuit metadata
    if (pkg.tscircuit?.category) {
      return pkg.tscircuit.category as ComponentCategory;
    }

    // Infer from keywords and description
    if (keywords.includes('resistor') || description.includes('resistor') || name.includes('resistor')) return 'resistor';
    if (keywords.includes('capacitor') || description.includes('capacitor') || name.includes('capacitor')) return 'capacitor';
    if (keywords.includes('inductor') || description.includes('inductor') || name.includes('inductor')) return 'inductor';
    if (keywords.includes('diode') || description.includes('diode') || name.includes('diode')) return 'diode';
    if (keywords.includes('transistor') || description.includes('transistor') || name.includes('transistor')) return 'transistor';
    if (keywords.includes('ic') || description.includes('integrated circuit') || name.includes('ic')) return 'ic';
    if (keywords.includes('connector') || description.includes('connector') || name.includes('connector')) return 'connector';
    if (keywords.includes('led') || description.includes('led') || name.includes('led')) return 'led';
    if (keywords.includes('switch') || description.includes('switch') || name.includes('switch')) return 'switch';
    if (keywords.includes('sensor') || description.includes('sensor') || name.includes('sensor')) return 'sensor';
    if (keywords.includes('crystal') || description.includes('crystal') || name.includes('crystal')) return 'crystal';
    if (keywords.includes('relay') || description.includes('relay') || name.includes('relay')) return 'relay';
    if (keywords.includes('transformer') || description.includes('transformer') || name.includes('transformer')) return 'transformer';
    if (keywords.includes('fuse') || description.includes('fuse') || name.includes('fuse')) return 'fuse';
    if (keywords.includes('battery') || description.includes('battery') || name.includes('battery')) return 'battery';
    if (keywords.includes('motor') || description.includes('motor') || name.includes('motor')) return 'motor';
    if (keywords.includes('display') || description.includes('display') || name.includes('display')) return 'display';
    if (keywords.includes('antenna') || description.includes('antenna') || name.includes('antenna')) return 'antenna';

    return 'other';
  }

  private extractSpecsFromDescription(description: string, keywords: string[]): Record<string, any> {
    const specs: Record<string, any> = {};
    const text = `${description} ${keywords.join(' ')}`.toLowerCase();

    // Extract voltage specifications
    const voltageMatch = text.match(/(\d+(?:\.\d+)?)\s*v(?:olt)?/);
    if (voltageMatch) {
      specs.voltage = parseFloat(voltageMatch[1]);
    }

    // Extract current specifications
    const currentMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ma|amp|ampere)/);
    if (currentMatch) {
      specs.current = parseFloat(currentMatch[1]);
    }

    // Extract resistance specifications
    const resistanceMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ohm|Ω|k|m)/);
    if (resistanceMatch) {
      specs.resistance = parseFloat(resistanceMatch[1]);
    }

    // Extract capacitance specifications
    const capacitanceMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:pf|nf|uf|farad)/);
    if (capacitanceMatch) {
      specs.capacitance = parseFloat(capacitanceMatch[1]);
    }

    // Extract package/footprint information
    const packageMatch = text.match(/(sot-23|sot-89|to-220|dip|smd|0805|0603|1206|bga|qfn|soic|ssop|tssop|lqfp)/);
    if (packageMatch) {
      specs.footprint = packageMatch[1].toUpperCase();
    }

    return specs;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default TscircuitAPI;