import { afterEach, describe, expect, it } from "vitest";
import { isAuthorizedCronRequest } from "@/lib/push/config";

describe("cron request authorization", () => {
  const previous = process.env.CRON_SECRET;

  afterEach(() => {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  });

  it("accepts Bearer, x-cron-secret, and ?secret=", () => {
    process.env.CRON_SECRET = "test-secret-value";

    expect(
      isAuthorizedCronRequest(
        new Request("https://www.hangul-hour.app/api/push/cron", {
          headers: { authorization: "Bearer test-secret-value" },
        }),
      ),
    ).toBe(true);

    expect(
      isAuthorizedCronRequest(
        new Request("https://www.hangul-hour.app/api/push/cron", {
          headers: { "x-cron-secret": "test-secret-value" },
        }),
      ),
    ).toBe(true);

    expect(
      isAuthorizedCronRequest(
        new Request(
          "https://www.hangul-hour.app/api/push/cron?secret=test-secret-value",
        ),
      ),
    ).toBe(true);

    expect(
      isAuthorizedCronRequest(
        new Request("https://www.hangul-hour.app/api/push/cron?secret=wrong"),
      ),
    ).toBe(false);
  });
});
