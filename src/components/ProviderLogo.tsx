import clsx from 'clsx';

interface ProviderLogoProps {
  provider: string;
  className?: string;
  size?: number;
}

// Brand colors for each provider
export const PROVIDER_COLORS: Record<string, { primary: string; glow: string }> = {
  openai: { primary: '#10A37F', glow: 'rgba(16, 163, 127, 0.4)' },
  anthropic: { primary: '#D97706', glow: 'rgba(217, 119, 6, 0.4)' },
  google: { primary: '#4285F4', glow: 'rgba(66, 133, 244, 0.4)' },
  meta: { primary: '#0668E1', glow: 'rgba(6, 104, 225, 0.4)' },
  mistral: { primary: '#FF7000', glow: 'rgba(255, 112, 0, 0.4)' },
  deepseek: { primary: '#4D6BFE', glow: 'rgba(77, 107, 254, 0.4)' },
  xai: { primary: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.3)' },
  default: { primary: '#6B7280', glow: 'rgba(107, 114, 128, 0.3)' },
};

export function getProviderKey(provider: string): string {
  const p = provider.toLowerCase();
  if (p.includes('openai') || p.includes('gpt')) return 'openai';
  if (p.includes('anthropic') || p.includes('claude') || p.includes('haiku') || p.includes('sonnet') || p.includes('opus')) return 'anthropic';
  if (p.includes('google') || p.includes('gemini')) return 'google';
  if (p.includes('meta') || p.includes('llama')) return 'meta';
  if (p.includes('mistral')) return 'mistral';
  if (p.includes('deepseek')) return 'deepseek';
  if (p.includes('xai') || p.includes('grok')) return 'xai';
  return 'default';
}

export function getProviderColor(provider: string): { primary: string; glow: string } {
  return PROVIDER_COLORS[getProviderKey(provider)] || PROVIDER_COLORS.default;
}

// OpenAI Logo
function OpenAILogo({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ width: size, height: size }}
      fill="currentColor"
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

// Anthropic Logo
function AnthropicLogo({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ width: size, height: size }}
      fill="currentColor"
    >
      <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.521zm4.132 10.501L8.136 7.385l-2.57 6.636h5.135z" />
    </svg>
  );
}

// Google/Gemini Logo (4-color G)
function GoogleLogo({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ width: size, height: size }}
    >
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// Meta Logo
function MetaLogo({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ width: size, height: size }}
      fill="currentColor"
    >
      <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a4.892 4.892 0 0 0 1.12 2.074c.56.591 1.31.979 2.22 1.097.47.061.986.077 1.557.048.595-.03 1.237-.11 1.91-.24a14.833 14.833 0 0 0 2.005-.52c.696-.226 1.449-.535 2.27-.947l.09-.045.107-.054.163-.082-.11.055c.517.272 1.08.547 1.676.81.597.263 1.22.487 1.846.672.625.185 1.247.315 1.848.391.6.076 1.165.088 1.667.032.502-.057.955-.185 1.356-.39a3.343 3.343 0 0 0 1.025-.805c.281-.328.507-.716.678-1.159.17-.443.282-.94.334-1.49.052-.548.04-1.157-.033-1.825a11.69 11.69 0 0 0-.384-1.87 13.697 13.697 0 0 0-.72-1.904 14.164 14.164 0 0 0-1.025-1.844 13.245 13.245 0 0 0-1.296-1.663A10.949 10.949 0 0 0 16.1 5.29a8.378 8.378 0 0 0-1.658-.964A6.035 6.035 0 0 0 12.812 4c-.525 0-1.03.063-1.513.19-.483.128-.95.325-1.398.593-.448.268-.874.6-1.28.998-.405.397-.78.854-1.124 1.372L6.9 7.897l-.573-.767A5.919 5.919 0 0 0 6.915 4.03zm10.357 3.535c.282 0 .576.048.872.138.296.09.597.235.89.427a6.2 6.2 0 0 1 .847.67c.27.255.527.554.768.896.24.343.464.727.668 1.152.204.425.387.888.543 1.39.155.5.277 1.027.36 1.58.082.553.117 1.117.098 1.691a4.95 4.95 0 0 1-.161 1.149 2.177 2.177 0 0 1-.372.78c-.16.212-.36.376-.595.49a2.246 2.246 0 0 1-.778.203c-.272.02-.574.01-.9-.023a8.639 8.639 0 0 1-1.036-.188 11.047 11.047 0 0 1-1.133-.373c-.386-.15-.786-.345-1.198-.585L15.6 14.63l.083-.043c.184-.093.363-.2.536-.32a4.128 4.128 0 0 0 .486-.396c.152-.147.295-.31.43-.486a4.33 4.33 0 0 0 .365-.55 5.38 5.38 0 0 0 .294-.596 6.64 6.64 0 0 0 .215-.618c.06-.204.106-.403.14-.598.034-.196.052-.381.054-.559a2.533 2.533 0 0 0-.058-.51 1.418 1.418 0 0 0-.175-.434.963.963 0 0 0-.3-.303.787.787 0 0 0-.422-.117c-.262 0-.545.1-.835.298-.29.199-.591.479-.896.84-.304.36-.615.799-.927 1.316s-.619 1.104-.917 1.759c-.298.655-.588 1.37-.865 2.145-.277.774-.536 1.596-.773 2.465l-.164.6-.26-.463a43.063 43.063 0 0 1-.754-1.395 34.174 34.174 0 0 1-.674-1.384 25.477 25.477 0 0 1-.58-1.337 18.213 18.213 0 0 1-.464-1.24 12.146 12.146 0 0 1-.332-1.09 6.96 6.96 0 0 1-.18-.884 4.348 4.348 0 0 1-.006-.645c.025-.2.073-.38.145-.537a.958.958 0 0 1 .285-.356.716.716 0 0 1 .418-.133c.277 0 .574.118.88.35.306.233.619.552.933.954.313.402.625.874.932 1.414.306.54.603 1.134.886 1.78l.53 1.213.482-.897c.31-.58.623-1.13.94-1.647.315-.516.63-.993.94-1.427.31-.435.612-.823.902-1.165.29-.341.564-.627.816-.858a4.2 4.2 0 0 1 .698-.541 2.14 2.14 0 0 1 .538-.256c.17-.05.34-.074.502-.074z" />
    </svg>
  );
}

// Mistral Logo (stylized M)
function MistralLogo({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ width: size, height: size }}
      fill="currentColor"
    >
      <rect x="1" y="3" width="4" height="4" />
      <rect x="1" y="10" width="4" height="4" />
      <rect x="1" y="17" width="4" height="4" />
      <rect x="6" y="6" width="4" height="4" rx="0" />
      <rect x="6" y="13" width="4" height="4" />
      <rect x="10" y="3" width="4" height="4" />
      <rect x="10" y="10" width="4" height="4" />
      <rect x="10" y="17" width="4" height="4" />
      <rect x="14" y="6" width="4" height="4" />
      <rect x="14" y="13" width="4" height="4" />
      <rect x="19" y="3" width="4" height="4" />
      <rect x="19" y="10" width="4" height="4" />
      <rect x="19" y="17" width="4" height="4" />
    </svg>
  );
}

// DeepSeek Logo
function DeepSeekLogo({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ width: size, height: size }}
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5v-4H8l4-7v4h3l-4 7z" />
    </svg>
  );
}

// xAI/Grok Logo
function XAILogo({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ width: size, height: size }}
      fill="currentColor"
    >
      <path d="M13.982 10.622 20.54 3h-1.554l-5.693 6.618L8.745 3H3.5l6.876 10.007L3.5 21h1.554l6.012-6.989L15.868 21h5.245l-7.131-10.378Zm-2.128 2.474-.697-.997-5.543-7.93H8l4.474 6.4.697.996 5.815 8.318h-2.387l-4.745-6.787Z" />
    </svg>
  );
}

// Default/Fallback Logo
function DefaultLogo({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ width: size, height: size }}
    >
      <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

export function ProviderLogo({ provider, className, size = 16 }: ProviderLogoProps) {
  const key = getProviderKey(provider);
  const color = PROVIDER_COLORS[key] || PROVIDER_COLORS.default;

  const logoProps = {
    size,
    className: clsx(className),
  };

  const wrapperStyle = { color: color.primary, display: 'inline-flex' as const };

  switch (key) {
    case 'openai':
      return <span style={wrapperStyle}><OpenAILogo {...logoProps} /></span>;
    case 'anthropic':
      return <span style={wrapperStyle}><AnthropicLogo {...logoProps} /></span>;
    case 'google':
      return <span style={wrapperStyle}><GoogleLogo {...logoProps} /></span>;
    case 'meta':
      return <span style={wrapperStyle}><MetaLogo {...logoProps} /></span>;
    case 'mistral':
      return <span style={wrapperStyle}><MistralLogo {...logoProps} /></span>;
    case 'deepseek':
      return <span style={wrapperStyle}><DeepSeekLogo {...logoProps} /></span>;
    case 'xai':
      return <span style={wrapperStyle}><XAILogo {...logoProps} /></span>;
    default:
      return <span style={{ color: PROVIDER_COLORS.default.primary, display: 'inline-flex' }}><DefaultLogo {...logoProps} /></span>;
  }
}
