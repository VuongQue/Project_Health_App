import axiosClient from "./axiosClient";

/**
 * API cho Challenge
 * Map trực tiếp với ChallengeController (NestJS)
 */
const challengeApi = {
  /**
   * Lấy danh sách challenge (kèm joined + progress nếu đã join)
   * GET /challenges
   */
  getAll() {
    return axiosClient.get("/challenges");
  },

  /**
   * Tham gia challenge
   * POST /challenges/:id/join
   */
  join(challengeId: number) {
    return axiosClient.post(`/challenges/${challengeId}/join`);
  },

  /**
   * Rời challenge (theo userChallengeId)
   * DELETE /challenges/me/:userChallengeId
   */
  leave(userChallengeId: number) {
    return axiosClient.delete(`/challenges/me/${userChallengeId}`);
  },

  /**
   * Lấy challenge của user (ongoing + completed)
   * GET /challenges/me
   */
  getMyChallenges() {
    return axiosClient.get("/challenges/me");
  },

  /**
   * Lấy chi tiết 1 userChallenge
   * GET /challenges/me/:userChallengeId
   */
  getMyChallengeDetail(userChallengeId: number) {
    return axiosClient.get(`/challenges/me/${userChallengeId}`);
  },

  /**
   * ========== ADMIN ==========
   */

  /**
   * Admin tạo challenge
   * POST /challenges
   */
  create(data: any) {
    return axiosClient.post("/challenges", data);
  },

  /**
   * Admin update challenge
   * PATCH /challenges/:id
   */
  update(challengeId: number, data: any) {
    return axiosClient.patch(`/challenges/${challengeId}`, data);
  },

  /**
   * Admin deactivate challenge
   * PATCH /challenges/:id/deactivate
   */
  deactivate(challengeId: number) {
    return axiosClient.patch(`/challenges/${challengeId}/deactivate`);
  },
};

export default challengeApi;
