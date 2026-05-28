import { describe, it, expect } from "vitest";
import { validate } from "./index";
import { encodeDocument, decodeDocument, type MintDocument } from "./document";

describe("🌿 MINT Document", () => {
  const sample: MintDocument = {
    title: "Returns & Refunds SOP",
    metadata: { pages: 4, author: "Acme Ops" },
    sections: [
      {
        heading: "Overview",
        level: 1,
        blocks: [
          {
            type: "text",
            text: "This SOP covers returns.\nIt applies to all stores.",
          },
        ],
      },
      {
        heading: "Eligibility",
        level: 2,
        blocks: [
          { type: "text", text: "Items are eligible within 30 days." },
          {
            type: "table",
            table: {
              caption: "Return windows",
              headers: ["Category", "Days"],
              rows: [
                ["Apparel", "30"],
                ["Electronics", "14"],
              ],
            },
          },
          {
            type: "list",
            list: {
              ordered: true,
              items: ["Inspect item", "Issue refund", "Update inventory"],
            },
          },
          { type: "figure", figure: { caption: "Refund flow", page: 3 } },
        ],
      },
    ],
  };

  it("round-trips a full document losslessly", () => {
    expect(decodeDocument(encodeDocument(sample))).toEqual(sample);
  });

  it("produces output that passes MINT validation", () => {
    expect(validate(encodeDocument(sample)).valid).toBe(true);
  });

  it("renders headings with § level markers, not # (reserved for comments)", () => {
    const out = encodeDocument(sample);
    expect(out).toContain("§1 Overview");
    expect(out).toContain("§2 Eligibility");
    expect(out).not.toMatch(/^#/m);
  });

  it("renders tables with optional captions and MINT pipe syntax", () => {
    const out = encodeDocument(sample);
    expect(out).toContain("@table: Return windows");
    expect(out).toMatch(/\| Category\s+\| Days\s+\|/);
  });

  it("renders ordered vs unordered lists distinctly and round-trips", () => {
    const doc: MintDocument = {
      sections: [
        {
          heading: "Lists",
          level: 1,
          blocks: [
            {
              type: "list",
              list: { ordered: false, items: ["alpha", "beta"] },
            },
            { type: "list", list: { ordered: true, items: ["one", "two"] } },
          ],
        },
      ],
    };
    const out = encodeDocument(doc);
    expect(out).toContain("- alpha");
    expect(out).toContain("1. one");
    expect(decodeDocument(out)).toEqual(doc);
  });

  it("escapes prose lines that begin with reserved markers", () => {
    const doc: MintDocument = {
      sections: [
        {
          heading: "Tricky",
          level: 1,
          blocks: [
            {
              type: "text",
              text: "| not a table\n- not a list\n§ not a heading\n@ not a tag",
            },
          ],
        },
      ],
    };
    expect(decodeDocument(encodeDocument(doc))).toEqual(doc);
  });

  it("handles figures with only a caption or only a page", () => {
    const doc: MintDocument = {
      sections: [
        {
          heading: "Figures",
          level: 1,
          blocks: [
            { type: "figure", figure: { caption: "Diagram only" } },
            { type: "figure", figure: { page: 7 } },
            { type: "figure", figure: {} },
          ],
        },
      ],
    };
    expect(decodeDocument(encodeDocument(doc))).toEqual(doc);
  });

  it("round-trips a document with no title or metadata", () => {
    const doc: MintDocument = {
      sections: [
        {
          heading: "Body",
          level: 1,
          blocks: [{ type: "text", text: "Just text." }],
        },
      ],
    };
    expect(decodeDocument(encodeDocument(doc))).toEqual(doc);
  });
});
