import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: vi.fn(), sign: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSessionClient: mocks.client }));
vi.mock("@/lib/storage", () => ({ signPhotoUrlsAdmin: mocks.sign }));
import { listOptions } from "@/lib/dal/properties";

it("loads select options with one bounded query and no cover signing", async () => {
  const rows = [{ id: "fixture-property", code: "FIX-1", title: "Fixture" }];
  const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
  const order = vi.fn().mockReturnValue({ limit });
  const is = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ is });
  const from = vi.fn().mockReturnValue({ select });
  mocks.client.mockResolvedValue({ from });
  expect(await listOptions()).toEqual(rows);
  expect(from).toHaveBeenCalledExactlyOnceWith("properties");
  expect(select).toHaveBeenCalledExactlyOnceWith("id, code, title");
  expect(is).toHaveBeenCalledWith("deleted_at", null);
  expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
  expect(limit).toHaveBeenCalledWith(20);
  expect(mocks.sign).not.toHaveBeenCalled();
});
