export type ReportProvider = 'openrouter' | 'vercel';
export interface ReportProviderConfig {
  provider: ReportProvider;
  api_key: string;
  transcription_model: string;
  interpretation_model: string;
  ffmpeg_path?: string;
}
/** Only the selected provider's configuration is required. Never return environment values in problems. */
export function reportProviderConfiguration(env: Readonly<Record<string, string | undefined>> = process.env): {
  provider: ReportProvider | null;
  config: ReportProviderConfig | null;
  problems: string[];
} {
  const provider = env['AI_PROVIDER'] ?? 'openrouter';
  if (provider !== 'openrouter' && provider !== 'vercel') return { provider: null, config: null, problems: ['AI_PROVIDER must be openrouter or vercel'] };
  const prefix = provider === 'openrouter' ? 'OPENROUTER' : 'AI_GATEWAY';
  const api_key = env[`${prefix}_API_KEY`]?.trim();
  const transcription_model = env[`${prefix}_TRANSCRIPTION_MODEL`]?.trim();
  const interpretation_model = env[`${prefix}_INTERPRETATION_MODEL`]?.trim();
  const problems = ['API_KEY', 'TRANSCRIPTION_MODEL', 'INTERPRETATION_MODEL'].filter(suffix => !env[`${prefix}_${suffix}`]?.trim()).map(suffix => `${prefix}_${suffix} is not configured`);
  const ffmpeg_path = env['FFMPEG_PATH']?.trim();
  return { provider, problems, config: api_key && transcription_model && interpretation_model ? { provider, api_key, transcription_model, interpretation_model, ...(ffmpeg_path ? { ffmpeg_path } : {}) } : null };
}
