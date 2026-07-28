import { describe, expect, it } from "vitest";
import { buildPageList } from "@/components/Pagination";

describe("buildPageList", () => {
  it("shows every page when there are 7 or fewer", () => {
    expect(buildPageList(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPageList(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses long runs around the current page with ellipses", () => {
    expect(buildPageList(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
  });

  it("does not duplicate an ellipsis when the window touches an edge", () => {
    expect(buildPageList(1, 12)).toEqual([1, 2, "ellipsis", 12]);
    expect(buildPageList(12, 12)).toEqual([1, "ellipsis", 11, 12]);
  });

  it("handles the current page sitting right next to the boundary", () => {
    expect(buildPageList(2, 12)).toEqual([1, 2, 3, "ellipsis", 12]);
  });
});
