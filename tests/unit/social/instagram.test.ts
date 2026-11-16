import { describe, expect, it, vi } from "vitest";

// unstable_cache is a pass-through outside Next
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));

const { captionAlt, getInstagramPosts, isInstagramCdn, parseMedia } = await import("@/lib/social/instagram");

const post = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  caption: `Post ${id}`,
  media_type: "IMAGE",
  media_url: `https://scontent-iad3-1.cdninstagram.com/v/${id}.jpg?oe=1`,
  permalink: `https://www.instagram.com/p/${id}/`,
  timestamp: "2026-11-15T20:00:00+0000",
  ...extra,
});

describe("Instagram media", () => {
  it("takes five posts, the video's thumbnail as its picture", () => {
    const data = [
      post("1"),
      post("2", {
        media_type: "VIDEO",
        media_url: undefined,
        thumbnail_url: "https://scontent.xx.fbcdn.net/t.jpg",
      }),
      post("3", { media_type: "CAROUSEL_ALBUM" }),
      post("4"),
      post("5"),
      post("6"),
    ];
    const posts = parseMedia({ data, paging: {} }, "fallback");
    expect(posts.map((p) => p.id)).toEqual(["1", "2", "3", "4", "5"]);
    expect(posts[1]?.image).toBe("https://scontent.xx.fbcdn.net/t.jpg");
    expect(posts[0]?.href).toBe("https://www.instagram.com/p/1/");
  });
  it("leaves out posts with no picture, another host or a strange permalink", () => {
    const posts = parseMedia(
      {
        data: [
          post("a", { media_type: "VIDEO", media_url: undefined }),
          post("b", { media_url: "https://example.com/x.jpg" }),
          post("c", { permalink: "https://evil.example/p/c/" }),
          post("d", { media_type: "STORY" }),
          post("ok"),
        ],
      },
      "fallback",
    );
    expect(posts.map((p) => p.id)).toEqual(["ok"]);
  });
  it("rejects an answer without data", () => {
    expect(() => parseMedia({ error: { message: "expired" } }, "x")).toThrow();
  });
  it("uses the caption as alt, flattened and cut at a word", () => {
    expect(captionAlt("  Fresh  pour\n\ntonight  ", "fb")).toBe("Fresh pour tonight");
    expect(captionAlt(null, "fb")).toBe("fb");
    const long = captionAlt(`${"word ".repeat(60)}end`, "fb");
    expect(long.length).toBeLessThanOrEqual(201);
    expect(long.endsWith("word…")).toBe(true);
  });
  it("knows Instagram's image hosts", () => {
    expect(isInstagramCdn("https://scontent-lga3-1.cdninstagram.com/a.jpg")).toBe(true);
    expect(isInstagramCdn("https://scontent.xx.fbcdn.net/a.jpg")).toBe(true);
    expect(isInstagramCdn("http://scontent.cdninstagram.com/a.jpg")).toBe(false);
    expect(isInstagramCdn("https://cdninstagram.com.evil.example/a.jpg")).toBe(false);
  });
  it("gives nothing without a token", async () => {
    const before = process.env.INSTAGRAM_ACCESS_TOKEN;
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    expect(await getInstagramPosts("x")).toEqual([]);
    if (before !== undefined) process.env.INSTAGRAM_ACCESS_TOKEN = before;
  });
  it("gives nothing when Instagram fails, and never logs the token", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 400 }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await getInstagramPosts("x")).toEqual([]);
    expect(warn.mock.calls.flat().join(" ")).not.toContain("test-token");
    spy.mockRestore();
    warn.mockRestore();
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
  });
});
