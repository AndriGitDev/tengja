export interface IcelandASN {
  asn: number;
  name: string;
  type: "isp" | "enterprise" | "government" | "education" | "hosting";
}

// Key Icelandic ASNs (subset of 91 total)
export const keyAsns: IcelandASN[] = [
  { asn: 44735, name: "NOVA hf.", type: "isp" },
  { asn: 6677, name: "Síminn hf.", type: "isp" },
  { asn: 51896, name: "Hringdu ehf.", type: "isp" },
  { asn: 12969, name: "Ljósleiðarinn (Vodafone IS)", type: "isp" },
  { asn: 30818, name: "Farice ehf.", type: "enterprise" },
  { asn: 25509, name: "Verne Global", type: "hosting" },
  { asn: 211589, name: "RÚV (National Broadcasting)", type: "enterprise" },
  { asn: 43571, name: "Advania Ísland", type: "hosting" },
  { asn: 15474, name: "Míla ehf.", type: "isp" },
];

export const totalIcelandAsns = 91;
