import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 100 }, // Ramp up to 100 users over 10s
    { duration: "30s", target: 100 }, // Stay at 100 users for 30s
    { duration: "10s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of DB-intensive requests must complete below 500ms
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const url = "http://localhost:8000/api/reservation/check-availability";

  const payload = JSON.stringify({
    facility_id: "11111111-1111-1111-1111-111111111111",
    start_time: "2026-10-04T10:00:00Z",
    end_time: "2026-10-04T12:00:00Z",
    vehicle_type: "car",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    "is status 200": (r) => r.status === 200,
    "has valid response": (r) => r.json() !== null,
  });

  sleep(0.5);
}
