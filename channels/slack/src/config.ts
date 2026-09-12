export interface SlackAdapterConfig {
  botToken: string;
  signingSecret: string;
  appToken: string;
  allowedChannels: Set<string>;
  allowedUsers: Set<string> | null;
  supplierChannel: string | null;
  maxAttachmentBytes: number;
  maxAudioSeconds: number;
  coreUrl: string | null;
  coreChannelSecret: string;
  logLevel: "debug" | "info" | "warn" | "error";
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name} (see .env.example)`);
  return v;
}

function list(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function loadConfig(): SlackAdapterConfig {
  const allowedChannels = new Set(list("SLACK_ALLOWED_CHANNELS"));
  if (allowedChannels.size === 0) {
    throw new Error("SLACK_ALLOWED_CHANNELS must list at least one channel id");
  }
  const users = list("SLACK_ALLOWED_USERS");
  const level = (process.env.LOG_LEVEL ?? "info") as SlackAdapterConfig["logLevel"];
  return {
    botToken: required("SLACK_BOT_TOKEN"),
    signingSecret: required("SLACK_SIGNING_SECRET"),
    appToken: required("SLACK_APP_TOKEN"),
    allowedChannels,
    allowedUsers: users.length ? new Set(users) : null,
    supplierChannel: process.env.SLACK_SUPPLIER_CHANNEL || null,
    maxAttachmentBytes: Number(process.env.MAX_ATTACHMENT_MB ?? 10) * 1024 * 1024,
    maxAudioSeconds: Number(process.env.MAX_AUDIO_SECONDS ?? 60),
    coreUrl: process.env.CORE_URL || null,
    coreChannelSecret: process.env.CORE_CHANNEL_SECRET ?? "",
    logLevel: level,
  };
}
