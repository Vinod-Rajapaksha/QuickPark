import http from "k6/http";
import { check, sleep } from "k6";

// Test configuration
export const options = {
  stages: [
    { duration: "10s", target: 20 }, // Ramp up to 20 concurrent admin users over 10s
    { duration: "30s", target: 20 }, // Stay at 20 users for 30s
    { duration: "10s", target: 0 }, // Ramp down to 0 users over 10s
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    http_req_failed: ["rate<0.01"], // Error rate should be less than 1%
  },
};

const BASE_URL = "http://localhost:5034/api";
export default function () {
  // 1. Simulate Admin Login
  const loginPayload = JSON.stringify({
    email: "admin@quickpark.com",
    password: "password123",
  });

  const loginHeaders = {
    "Content-Type": "application/json",
  };

  const loginRes = http.post(`${BASE_URL}/Auth/login`, loginPayload, {
    headers: loginHeaders,
  });

  check(loginRes, {
    "login successful": (r) => r.status === 200,
  });

  if (loginRes.status !== 200) {
    console.error(
      `Login failed with status ${loginRes.status}. Body: ${loginRes.body}`,
    );
    sleep(1);
    return;
  }

  // Extract the JWT token
  const token = loginRes.json("token");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // 2. Fetch all facilities (Admin Endpoint)
  const facilitiesRes = http.get(`${BASE_URL}/ParkingFacilities/admin`, {
    headers: authHeaders,
  });

  check(facilitiesRes, {
    "fetched facilities": (r) => r.status === 200,
  });

  sleep(1);

  // 3. Fetch all registered users
  const usersRes = http.get(`${BASE_URL}/Users`, {
    headers: authHeaders,
  });

  check(usersRes, {
    "fetched users": (r) => r.status === 200,
  });

  sleep(1);
}
