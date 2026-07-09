import { SinkOption } from "../types";

export const defaultSinks: SinkOption[] = [
  {
    id: "sink_franke_ss_1",
    brandName: "Franke",
    material: "stainless_steel",
    mountType: "top_mount",
    standardCutoutMm: { widthMm: 800, heightMm: 500 },
    price: 3500,
    isPricePlaceholder: true
  },
  {
    id: "sink_franke_granite",
    brandName: "Franke",
    material: "granite_composite",
    mountType: "under_mount",
    standardCutoutMm: { widthMm: 700, heightMm: 450 },
    price: 8000,
    isPricePlaceholder: true
  },
  {
    id: "sink_teka_ss",
    brandName: "Teka",
    material: "stainless_steel",
    mountType: "top_mount",
    standardCutoutMm: { widthMm: 600, heightMm: 450 },
    price: 3000,
    isPricePlaceholder: true
  },
  {
    id: "sink_purity_ss",
    brandName: "Purity",
    material: "stainless_steel",
    mountType: "top_mount",
    standardCutoutMm: { widthMm: 600, heightMm: 450 },
    price: 1500,
    isPricePlaceholder: true
  },
  {
    id: "sink_schock_granite",
    brandName: "Schock",
    material: "granite_composite",
    mountType: "under_mount",
    standardCutoutMm: { widthMm: 800, heightMm: 500 },
    price: 12000,
    isPricePlaceholder: true
  }
];
