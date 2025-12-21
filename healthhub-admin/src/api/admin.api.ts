import { api } from "./axios";

// USERS
export const getUsers = (params: any) =>
  api.get("/admin/users", { params });

export const lockUser = (id: number) =>
  api.patch(`/admin/users/${id}/lock`);

export const unlockUser = (id: number) =>
  api.patch(`/admin/users/${id}/unlock`);

// POSTS
export const getPosts = (params: any) =>
  api.get("/admin/posts", { params });

export const hidePost = (id: string) =>
  api.patch(`/admin/posts/${id}/hide`);

export const deletePost = (id: string) =>
  api.delete(`/admin/posts/${id}`);

// ACHIEVEMENTS
export const getAchievements = () =>
  api.get("/admin/achievements");

// CHALLENGES
export const getChallenges = () =>
  api.get("/admin/challenges");

// DASHBOARD
export const getStats = () =>
  api.get("/admin/stats");

  // WORKOUTS
export const getWorkouts = (params?: any) =>
api.get("/admin/workouts", { params });

export const deleteWorkout = (id: number) =>
api.delete(`/admin/workouts/${id}`);

