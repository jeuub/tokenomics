# Tokenomics

**Cache-aware, tool-safe, per-turn cost-арбитр для coding-агентов.**

Прозрачный прокси между coding-агентом (Claude Code через `ANTHROPIC_BASE_URL`,
opencode / Cline / aider через OpenAI-compatible) и LLM-провайдером. **Per-turn**
принимает два решения — (1) самая дешёвая достаточная модель и (2) нужен ли вообще
полный контекст — и применяет оба **in-flight, не ломая tool-call state и prompt-cache**.

> Рабочее имя репозитория — `tokenomics` (как называет проект автор). Это НЕ форк
> `Tokenomics-AI/Tokenomics` — см. почему тот референс слабый в
> [market-and-positioning.md §5](docs/market-and-positioning.md).

---

## Главный тезис (verdict)

- **«Роутер моделей» как отдельный продукт — проигранная категория.** Коммодитизируется
  (RouterArena 2026: «нет универсально-оптимального роутера»; OSS даёт точность
  коммерческих за ~1/5 цены; Portkey поглощён Palo Alto; NVIDIA сворачивает LLM Router).
- **Но конкретный клин — свободен.** Рынок расколот надвое: одни **выбирают модель**
  (Not Diamond, Martian, RouteLLM, OpenRouter Auto), другие **режут контекст**
  (Headroom, LLMLingua, SWE-Pruner), третьи **только показывают** bloat (ContextSpy).
  **Никто не делает обе вещи per-turn внутри coding-agent-aware прокси, сохраняя tool-call state.**
- **Базовый юзкейс:** реплика «ты завис?» / «какой статус по ресурсам?» / «rename var»
  в 150k-токенной сессии не должна платить ни за Opus, ни за полный контекст. Никем не
  автоматизирован как drop-in.
- **Ров = (tool-call integrity) × (cache-aware decisioning) × (coding eval-proof)**,
  спаянные в один drop-in. Сам роутинг рвом НЕ является.

Питч одной строкой: **«Один env-var, и счёт за Claude Code падает на 40–70%, при этом ничего не ломается.»**

---

## Документы

| Файл | О чём |
|---|---|
| [docs/mvp-plan.md](docs/mvp-plan.md) | **Главный документ.** Тончайший продаваемый MVP (v0), что вырезано и почему, eval/guardrails, метрики успеха, roadmap v0→v1→v2 |
| [docs/economics.md](docs/economics.md) | **Cost-модель (verified mid-2026).** Когда подход выгоден: внутри-Anthropic vs кросс-провайдерно, ценовая лестница, break-even формулы, session-таблицы, бизнес-порог |
| [docs/model-ranking.md](docs/model-ranking.md) | **Мозг арбитра.** Как решать достаточность модели per-turn без хардкода и без вопросов к юзеру: priors → self-calibration → bandit cold-start; capability-профили; куда попадает новая модель |
| [docs/feedback-and-experimentation.md](docs/feedback-and-experimentation.md) | **Фидбэк/UX/эксперименты.** A/B без двух ответов (off-policy + cluster-рандомизация + shadow/dueling); бинарный thumbs vs 1–5 как gold-anchor; per-team affect через иерархический partial-pooling |
| [docs/architecture.md](docs/architecture.md) | Техническая реализация: data-path, arbiter pipeline, безопасная резка контекста, prompt-cache, дешёвый арбитр (L0→L1→L2), verify-and-escalate, decision-policy псевдо-спека, failure modes |
| [docs/market-and-positioning.md](docs/market-and-positioning.md) | Карта конкурентов (группы A/B/C/D), белое пятно, позиционирование, ICP/покупатель, почему референс-репо слабый |
| [docs/monetization-moat-risks.md](docs/monetization-moat-risks.md) | Pricing-модели, где durable moat, GTM (OSS wedge → cloud), **контрарианский разбор (7 причин смерти)**, win-conditions |
| [docs/demand-and-hiring-signal.md](docs/demand-and-hiring-signal.md) | Спрос (рынок $8.4B, +140%/6мес), вакансии «token economics»/TokenOps, build-vs-buy, якоря бюджета |
| [docs/references.md](docs/references.md) | Конкретные репо/продукты/папиры/доки для изучения |
| [docs/_research-dump.json](docs/_research-dump.json) | Сырой структурированный вывод 8 research-агентов (архив, источник правды) |

---

## Жёсткие инварианты (нарушать нельзя — это ров)

1. **Tool-state fidelity.** Открытый tool-цикл (`stop_reason: tool_use` с неотвеченными
   блоками) → **passthrough без изменений**. Резать/менять модель — только на чистых
   turn-boundary. Каждый `tool_use_id` обязан иметь парный `tool_result`.
2. **Cache-awareness.** Наивный стрип префикса РВЁТ prompt-cache (cache-read 0.1×) и делает
   запрос ДОРОЖЕ. Тривиальные ходы — только через **side-channel**, не возмущая канонический
   закэшированный диалог.
3. **No tool-call tampering.** Никогда не мутировать executable-содержимое tool-call
   (ресёрч: 9 из 428 роутеров инжектили код). Verbatim passthrough + self-host = ров.

---

## Первый шаг (до написания арбитра)

Построить **диагностический** прозрачный прокси (как ContextSpy, но на своём трафике) и
1–2 недели инструментировать реальные Claude Code сессии через `X-Claude-Code-Session-Id`.
Измерить: **(а) реальную долю context-free ходов** и **(б) долю background/subagent-трафика**.
Это валидирует win-conditions #1 и #4 за копейки — до того как тратить месяцы на safe-rewrite арбитр.

---

## Статус

Pre-code. Документация = результат многоагентного ресёрча (8 research-агентов + 4 синтезатора,
веб-источники mid-2026). Цифры из веба (spend, оценки, факты M&A) — приблизительные, помечены
в текстах. Следующий артефакт — техспека MVP v0 со стеком и структурой кода.
