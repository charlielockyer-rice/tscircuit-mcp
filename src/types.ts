export interface RegistryPackage {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  links: {
    npm: string;
    homepage?: string;
    repository?: string;
  };
  author?: {
    name: string;
    email?: string;
  };
  license?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  tscircuit?: {
    type: string;
    category?: string;
    footprint?: string;
    specifications?: Record<string, any>;
  };
}

export interface RegistrySearchResult {
  package: RegistryPackage;
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
}

export interface RegistrySearchResponse {
  objects: RegistrySearchResult[];
  total: number;
  time: string;
}

export interface PackageDetails extends RegistryPackage {
  readme?: string;
  versions?: string[];
  downloads?: {
    weekly: number;
    monthly: number;
  };
  github?: {
    starsCount: number;
    forksCount: number;
    openIssuesCount: number;
  };
}

export interface ComponentSpec {
  type: string;
  category: string;
  footprint?: string;
  package?: string;
  pins?: Array<{
    name: string;
    number: number;
    type: string;
    description?: string;
  }>;
  electrical?: {
    voltage?: {
      min?: number;
      max?: number;
      nominal?: number;
    };
    current?: {
      min?: number;
      max?: number;
      nominal?: number;
    };
    power?: {
      max?: number;
    };
    resistance?: {
      min?: number;
      max?: number;
      nominal?: number;
    };
    capacitance?: {
      min?: number;
      max?: number;
      nominal?: number;
    };
    inductance?: {
      min?: number;
      max?: number;
      nominal?: number;
    };
    frequency?: {
      min?: number;
      max?: number;
    };
  };
  physical?: {
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
    weight?: number;
    temperature?: {
      min?: number;
      max?: number;
    };
  };
}

export interface SearchComponentsParams {
  query: string;
  limit?: number;
  category?: string;
}

export interface GetPackageDetailsParams {
  packageName: string;
}

export interface GetPackageCodeParams {
  packageName: string;
  version?: string;
}

export interface AnalyzeComponentParams {
  packageName: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode?: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export type ComponentCategory = 
  | 'resistor'
  | 'capacitor' 
  | 'inductor'
  | 'diode'
  | 'transistor'
  | 'ic'
  | 'connector'
  | 'led'
  | 'switch'
  | 'sensor'
  | 'crystal'
  | 'relay'
  | 'transformer'
  | 'fuse'
  | 'battery'
  | 'motor'
  | 'display'
  | 'antenna'
  | 'other';