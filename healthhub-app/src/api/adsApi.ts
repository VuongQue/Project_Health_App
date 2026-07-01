import axiosClient from "./axiosClient";

export type AdPlacement = "feed" | "personal_banner" | "splash";
export type AdMediaType = "image" | "video";
export type AdCategory =
  | "fitness" | "nutrition" | "supplement" | "equipment"
  | "wellness" | "apparel" | "general";

export interface Advertisement {
  id: number;
  title: string;
  brandName: string;
  description: string | null;
  mediaUrl: string;
  mediaType: AdMediaType;
  placement: AdPlacement;
  categories: AdCategory[];
  targetUrl: string | null;
  ctaText: string;
  isActive: boolean;
  priority: number;
}

const adsApi = {
  getActive: (placement: AdPlacement, categories?: AdCategory[]) => {
    const params: Record<string, string> = { placement };
    if (categories && categories.length > 0) {
      params.categories = categories.join(",");
    }
    return axiosClient.get<Advertisement[]>("/ads/active", { params });
  },

  trackImpression: (id: number) =>
    axiosClient.post(`/ads/${id}/impression`),

  trackClick: (id: number) =>
    axiosClient.post(`/ads/${id}/click`),
};

export default adsApi;
