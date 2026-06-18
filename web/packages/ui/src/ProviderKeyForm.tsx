import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./Button";

export const providerKeySchema = z.object({
  provider: z.string().min(1, "Provider name is required"),
  apiKey: z.string().min(8, "API key looks too short"),
  baseUrl: z.union([z.url("Must be a valid URL"), z.literal("")]).optional(),
});

export type ProviderKeyValues = z.infer<typeof providerKeySchema>;

export interface ProviderKeyFormProps {
  onSubmit: (values: ProviderKeyValues) => void | Promise<void>;
  defaultValues?: Partial<ProviderKeyValues>;
}

const field =
  "w-full bg-surface text-fg font-mono text-sm " +
  "border border-border px-3 py-2 " +
  "placeholder:text-fg-muted " +
  "focus-visible:outline-none focus-visible:border-accent";
const labelCls = "block font-mono text-xs uppercase tracking-wider text-fg-muted mb-1";
const errorCls = "mt-1 font-mono text-xs text-danger";

/**
 * BYOK provider-key form. Proves the RHF 7 + zod 4 + @hookform/resolvers v5
 * stack. zodResolver auto-detects zod v4; types are inferred from the schema.
 */
export function ProviderKeyForm({ onSubmit, defaultValues }: ProviderKeyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProviderKeyValues>({
    resolver: zodResolver(providerKeySchema),
    defaultValues: { provider: "", apiKey: "", baseUrl: "", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label className={labelCls} htmlFor="pk-provider">
          Provider
        </label>
        <input id="pk-provider" className={field} autoComplete="off" {...register("provider")} />
        {errors.provider && (
          <p className={errorCls} role="alert">
            {errors.provider.message}
          </p>
        )}
      </div>

      <div>
        <label className={labelCls} htmlFor="pk-apikey">
          API Key
        </label>
        <input
          id="pk-apikey"
          type="password"
          className={field}
          autoComplete="off"
          spellCheck={false}
          {...register("apiKey")}
        />
        {errors.apiKey && (
          <p className={errorCls} role="alert">
            {errors.apiKey.message}
          </p>
        )}
      </div>

      <div>
        <label className={labelCls} htmlFor="pk-baseurl">
          Base URL <span className="normal-case">(optional)</span>
        </label>
        <input
          id="pk-baseurl"
          type="url"
          className={field}
          placeholder="https://api.example.com"
          autoComplete="off"
          {...register("baseUrl")}
        />
        {errors.baseUrl && (
          <p className={errorCls} role="alert">
            {errors.baseUrl.message}
          </p>
        )}
      </div>

      <Button type="submit" variant="solid" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save key"}
      </Button>
    </form>
  );
}
