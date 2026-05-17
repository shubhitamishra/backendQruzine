import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// Custom metrics
export let responseTime = new Trend("response_time");
export let errorRate = new Rate("errors");
export let requestCount = new Counter("requests");

// Load testing configuration
export let options = {
  stages: [
    { duration: "1m", target: 10 },    // Warm up: 10 users
    { duration: "2m", target: 50 },    // Load test: 50 users
    { duration: "1m", target: 100 },   // Spike test: 100 users
    { duration: "3m", target: 100 },   // Hold spike: 100 users
    { duration: "1m", target: 200 },   // Peak load: 200 users
    { duration: "2m", target: 200 },   // Hold peak: 200 users
    { duration: "2m", target: 0 }      // Cool down
  ],
  thresholds: {
    errors: ["rate<0.1"],              // Less than 10% errors
    "http_req_duration": ["p(95)<2000"], // 95% of requests under 2s
    "http_req_duration": ["p(99)<5000"], // 99% of requests under 5s
    response_time: ["p(95)<2000"],
  }
};

const BASE = __ENV.TARGET || "http://localhost:5000";

// Test scenarios for different public routes
const scenarios = {
  // Health check - most basic endpoint
  healthCheck: () => {
    let res = http.get(`${BASE}/api/health`);
    
    const success = check(res, {
      "health check status 200": (r) => r.status === 200,
      "health check has uptime": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.uptime !== undefined;
        } catch {
          return false;
        }
      }
    });

    if (!success) errorRate.add(1);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  },

  // Menu browsing - high traffic endpoint
  browseMenu: () => {
    let res = http.get(`${BASE}/api/menu`);
    
    const success = check(res, {
      "menu fetch status 200 or 404": (r) => r.status === 200 || r.status === 404,
      "menu response time OK": (r) => r.timings.duration < 3000,
    });

    if (!success && res.status >= 500) errorRate.add(1);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  },

  // Categories browsing
  browseCategories: () => {
    let res = http.get(`${BASE}/api/categories`);
    
    const success = check(res, {
      "categories fetch status 200 or 404": (r) => r.status === 200 || r.status === 404,
      "categories response time OK": (r) => r.timings.duration < 3000,
    });

    if (!success && res.status >= 500) errorRate.add(1);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  },

  // QR code generation/access - likely public
  qrCodeAccess: () => {
    let res = http.get(`${BASE}/api/qr`);
    
    const success = check(res, {
      "qr access status not 500": (r) => r.status < 500,
      "qr response time OK": (r) => r.timings.duration < 2000,
    });

    if (res.status >= 500) errorRate.add(1);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  },

  // Banner viewing
  viewBanners: () => {
    let res = http.get(`${BASE}/api/banner`);
    
    const success = check(res, {
      "banner fetch status not 500": (r) => r.status < 500,
      "banner response time OK": (r) => r.timings.duration < 2000,
    });

    if (res.status >= 500) errorRate.add(1);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  },

  // Integration health check
  integrationHealth: () => {
    let res = http.get(`${BASE}/api/health/integrations`);
    
    const success = check(res, {
      "integration health not 500": (r) => r.status < 500,
      "integration health response time OK": (r) => r.timings.duration < 3000,
    });

    if (res.status >= 500) errorRate.add(1);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  },

  // Order placement simulation (POST) - if public
  simulateOrderInquiry: () => {
    const orderData = {
      items: [
        { name: "Test Item", quantity: 1, price: 10.99 }
      ],
      customerInfo: {
        name: `TestUser${Math.floor(Math.random() * 1000)}`,
        phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        email: `test${Math.floor(Math.random() * 1000)}@example.com`
      }
    };

    let res = http.post(`${BASE}/api/orders`, JSON.stringify(orderData), {
      headers: { "Content-Type": "application/json" },
    });

    const success = check(res, {
      "order inquiry status acceptable": (r) => r.status < 500,
      "order response time OK": (r) => r.timings.duration < 5000,
    });

    if (res.status >= 500) errorRate.add(1);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
  }
};

export default function () {
  // Weighted distribution of requests to simulate real traffic
  const random = Math.random();
  
  if (random < 0.3) {
    // 30% - Menu browsing (most common)
    scenarios.browseMenu();
  } else if (random < 0.5) {
    // 20% - Categories
    scenarios.browseCategories();
  } else if (random < 0.6) {
    // 10% - Health check
    scenarios.healthCheck();
  } else if (random < 0.75) {
    // 15% - Banner viewing
    scenarios.viewBanners();
  } else if (random < 0.85) {
    // 10% - QR code access
    scenarios.qrCodeAccess();
  } else if (random < 0.95) {
    // 10% - Integration health
    scenarios.integrationHealth();
  } else {
    // 5% - Order simulation
    scenarios.simulateOrderInquiry();
  }

  // Random sleep between 0.5 to 2 seconds to simulate user behavior
  sleep(Math.random() * 1.5 + 0.5);
}

// Setup function - runs once per VU at start
export function setup() {
  console.log(`Starting load test against: ${BASE}`);
  
  // Quick connectivity test
  let res = http.get(`${BASE}/api/health`);
  if (res.status !== 200) {
    console.warn(`Warning: Health check failed with status ${res.status}`);
  } else {
    console.log("✅ Server connectivity verified");
  }
  
  return { baseUrl: BASE };
}

// Teardown function - runs once after all VUs finish
export function teardown(data) {
  console.log("Load test completed!");
  console.log(`Target server was: ${data.baseUrl}`);
}