import { generateOpenAPI } from '../src/lib/openapi-registry.js';
console.log(JSON.stringify(generateOpenAPI(), null, 2));
