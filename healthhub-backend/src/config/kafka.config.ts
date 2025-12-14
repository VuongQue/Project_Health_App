export const KAFKA_BROKERS = (process.env.KAFKA_BROKERS ?? "localhost:9094")
  .split(",")
  .map(s => s.trim());

export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? "mravel-notification";
export const KAFKA_GROUP_ID  = process.env.KAFKA_GROUP_ID  ?? "notification-service-group";

export const TOPIC_NOTIFICATION_EVENTS = "notification.events";
