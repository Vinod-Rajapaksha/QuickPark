import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 50 }, // Ramp up to 50 users over 10s
    { duration: "30s", target: 50 }, // Stay at 50 users for 30s
    { duration: "10s", target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<3500"], // 95% of requests must complete below 3.5s
    http_req_failed: ["rate<0.01"], // Error rate must be less than 1%
  },
};

export default function () {
  const url = "http://localhost:8000/api/chat/message";
  const payload = JSON.stringify({
    message: "Find parking near SLIIT and reserve it for 2 hours",
    location_lat: 6.9147,
    location_lng: 79.9729,
    driver_id: "user_123",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    "is status 200": (r) => r.status === 200,
    "has valid response": (r) => r.json().message.content !== undefined,
  });

  sleep(1);
}
