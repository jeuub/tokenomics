// Verbatim landing copy, provider-neutral, keyed by locale.
//
// NOTE ON i18n: the design contract references Paraglide messages. The
// @tokenomics/i18n package is a COMPILED artifact (messages/*.json -> src/paraglide/*.js)
// and regenerating it is outside this app's build. To keep the scaffold buildable and
// self-contained, the landing's prose lives here as a typed, locale-keyed module with the
// EXACT verbatim strings. Integrators may later move these into messages/{ru,en}.json and
// swap call sites to Paraglide `m.*` without touching act/section markup.
//
// HARD INVARIANTS honored here:
//  - No model-name literals (those live ONLY in data/turn-log.ts).
//  - No numbers ($/%) baked into prose; all numeric copy is formatted from pricing-core.
//  - {placeholders} only where a value is injected at render time.

export type Locale = "ru" | "en";

export interface Copy {
  /** Act 1 — the single H1. */
  h1: string;
  /** Hero subheading. */
  sub: string;
  /** Three short support lines under the hero. */
  support: [string, string, string];
  /** Primary call to action label. */
  cta: string;
  /** The proof line shown everywhere money is mentioned. */
  proofLine: string;

  // Section <h2>s + supporting prose (numbers-free).
  act0Title: string;
  act0Body: string;

  act2Title: string;
  act2Body: string;

  act3Title: string;
  act3Body: string;

  act4Title: string;
  act4Body: string;

  act5Title: string;
  act5Body: string;
  /** Labels for the proof bars (baseline vs routed) and the saved readout. */
  act5Baseline: string;
  act5Routed: string;
  act5Saved: string;

  act6Title: string;
  act6Body: string;

  act7Title: string;
  act7Body: string;
  /** Install snippet env var names (values are placeholders, never real tokens). */
  installNote: string;

  act8Title: string;
  act8Body: string;

  // Shared link labels.
  loginLabel: string;
  getTokenLabel: string;
}

const en: Copy = {
  h1: "Match the model to the task. Every turn.",
  sub: "Tokenomics sits in front of Claude Code and opencode and routes each turn to the model that fits it — across DeepSeek, GLM, Gemini, Qwen, Anthropic and more. Tool calls pass through intact; you see which model ran and why. Savings are measured, not promised.",
  support: [
    "Per turn, not per session — matched to the work in front of it.",
    "Provider-neutral. Bring your own keys; cloud or self-host.",
    "Every route is shown: which model, and why.",
  ],
  cta: "Connect your keys.",
  proofLine: "Savings are measured, not promised.",

  act0Title: "Boot",
  act0Body: "A gateway warms up between your editor and the model providers.",

  act2Title: "The cost of overkill",
  act2Body:
    "Send every turn to your biggest model and most of the field is overdense — heavy answers for light work.",

  act3Title: "How routing works",
  act3Body:
    "Each turn is sized, then sent to the model that fits it. Tool calls pass through intact, in order.",

  act4Title: "Where the turns go",
  act4Body: "Turns sort themselves into tiers, and each tier lands on a right-sized model.",

  act5Title: "Measured savings",
  act5Body:
    "Run the numbers on your own usage. The routed total is never more expensive than your default model.",
  act5Baseline: "default model",
  act5Routed: "routed",
  act5Saved: "saved",

  act6Title: "Every route is shown",
  act6Body: "A per-turn log shows which model ran and why — nothing is hidden behind the gateway.",

  act7Title: "Bring your own keys",
  act7Body:
    "Point your editor at the gateway and supply your own provider keys. Cloud or self-host.",
  installNote: "Set these in your editor's environment. The token is yours; never share it.",

  act8Title: "Connect your keys.",
  act8Body: "Two environment variables and you are routing.",

  loginLabel: "login",
  getTokenLabel: "get-token",
};

const ru: Copy = {
  h1: "Своя модель под каждый ход.",
  sub: "Tokenomics встаёт перед Claude Code и opencode и направляет каждый ход к подходящей модели — среди DeepSeek, GLM, Gemini, Qwen, Anthropic и других. Вызовы инструментов проходят без изменений; видно, какая модель отработала и почему. Экономия измеряется, а не обещается.",
  support: [
    "За ход, а не за сессию — под задачу, что перед ним.",
    "Провайдер-нейтрально. Свои ключи; облако или self-host.",
    "Каждый маршрут показан: какая модель и почему.",
  ],
  cta: "Подключить ключи.",
  proofLine: "Экономия измеряется, а не обещается.",

  act0Title: "Загрузка",
  act0Body: "Шлюз прогревается между вашим редактором и провайдерами моделей.",

  act2Title: "Цена избыточности",
  act2Body:
    "Отправляйте каждый ход в самую большую модель — и поле переуплотнено: тяжёлые ответы на лёгкую работу.",

  act3Title: "Как работает маршрутизация",
  act3Body:
    "Каждый ход оценивается по размеру, затем уходит к подходящей модели. Вызовы инструментов проходят без изменений и по порядку.",

  act4Title: "Куда уходят ходы",
  act4Body:
    "Ходы сами раскладываются по уровням, и каждый уровень попадает в модель своего размера.",

  act5Title: "Измеренная экономия",
  act5Body:
    "Посчитайте на своих объёмах. Итог с маршрутизацией никогда не дороже вашей модели по умолчанию.",
  act5Baseline: "модель по умолчанию",
  act5Routed: "с маршрутизацией",
  act5Saved: "сэкономлено",

  act6Title: "Каждый маршрут показан",
  act6Body:
    "Журнал по ходам показывает, какая модель отработала и почему — за шлюзом ничего не скрыто.",

  act7Title: "Подключите свои ключи",
  act7Body: "Направьте редактор на шлюз и укажите свои ключи провайдеров. Облако или self-host.",
  installNote: "Задайте это в окружении вашего редактора. Токен ваш; никому не передавайте его.",

  act8Title: "Подключить ключи.",
  act8Body: "Две переменные окружения — и маршрутизация работает.",

  loginLabel: "login",
  getTokenLabel: "get-token",
};

const TABLE: Record<Locale, Copy> = { en, ru };

// The product/landing is English-only (founder directive). Locale is ignored;
// the RU table is kept only so the type stays exhaustive and is never rendered.
export function getCopy(_locale?: string | null): Copy {
  return TABLE.en;
}

// Install snippet — verbatim, provider-neutral, NO real token.
export const INSTALL_SNIPPET = {
  baseUrl: "ANTHROPIC_BASE_URL=https://gw.tokenomics.dev",
  authToken: "ANTHROPIC_AUTH_TOKEN=tok_<your-token>",
} as const;

// Real routes — never '#'.
export const LINKS = {
  login: "/login",
  getToken: "/signup",
} as const;
