// Environment types
type Environment = 'development' | 'production';

// Environment configuration interface
interface EnvironmentConfig {
  apiUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

// Determine the current environment
const getEnvironment = (): Environment => {
  if (typeof window === 'undefined') {
    // For server-side rendering
    return process.env.NODE_ENV as Environment || 'development';
  }

  // For client-side
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  
  return 'production';
};

// Environment-specific configurations
const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    apiUrl: 'http://localhost:5144',
    isProduction: false,
    isDevelopment: true,
  },
  production: {
    apiUrl: 'https://jma-test-jira-board-backend.azurewebsites.net',
    isProduction: true,
    isDevelopment: false,
  },
};

// Get current environment config
const currentEnv = getEnvironment();
const config: EnvironmentConfig = {
  ...environments[currentEnv],
  // Add any common config here
};

// Log the current environment (only in development)
if (currentEnv === 'development') {
  console.log(`Running in ${currentEnv} mode`);
  console.log('API URL:', config.apiUrl);
}

export default config;

// Helper functions
export const isProduction = (): boolean => config.isProduction;
export const isDevelopment = (): boolean => config.isDevelopment;
export const getApiUrl = (): string => config.apiUrl;
