import { useForm, Controller } from 'react-hook-form'
import * as Select from '@radix-ui/react-select'
import * as Switch from '@radix-ui/react-switch'
import { ChevronDown } from 'lucide-react'
import { Button } from '../ui/Button'
import { TONE_OPTIONS, LENGTH_OPTIONS } from '../../lib/constants'
import { cn } from '../../lib/utils'
import type { GenerateRequest } from '../../lib/api'

interface TopicFormProps {
  onSubmit: (data: GenerateRequest) => void
  isLoading: boolean
}

export function TopicForm({ onSubmit, isLoading }: TopicFormProps) {
  const { register, handleSubmit, control, watch } = useForm<GenerateRequest>({
    defaultValues: {
      topic: '',
      tone: 'thought-leadership',
      cta: 'Comment below or DM me to learn more',
      length: 'medium',
      include_hashtags: true,
    },
  })

  const selectedLength = watch('length')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <label className="block text-2xs font-semibold text-brand-teal uppercase tracking-widest mb-2">
          Topic
        </label>
        <textarea
          {...register('topic', { required: true, minLength: 5 })}
          rows={4}
          placeholder="What should InfinityBox post about today?"
          className={cn(
            'w-full resize-none rounded-xl border border-border bg-white px-4 py-3',
            'text-sm text-text-primary placeholder-text-muted',
            'focus:border-brand-teal transition-colors duration-150',
            'leading-relaxed'
          )}
          style={{ minHeight: '100px', fieldSizing: 'content' } as React.CSSProperties}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Tone</label>
          <Controller
            control={control}
            name="tone"
            render={({ field }) => (
              <Select.Root value={field.value} onValueChange={field.onChange}>
                <Select.Trigger
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2',
                    'text-sm text-text-primary focus:border-brand-teal transition-colors duration-150',
                    'data-[state=open]:border-brand-teal'
                  )}
                >
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown size={14} className="text-text-muted" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="bg-white border border-border rounded-xl shadow-card-hover z-50 overflow-hidden"
                    position="popper"
                    sideOffset={4}
                  >
                    <Select.Viewport className="p-1">
                      {TONE_OPTIONS.map((opt) => (
                        <Select.Item
                          key={opt.value}
                          value={opt.value}
                          className={cn(
                            'flex items-center px-3 py-2 rounded-lg text-sm text-text-primary cursor-pointer',
                            'hover:bg-surface focus:bg-surface outline-none transition-colors',
                            'data-[state=checked]:text-brand-teal data-[state=checked]:font-medium'
                          )}
                        >
                          <Select.ItemText>{opt.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            )}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">CTA</label>
          <input
            {...register('cta')}
            placeholder="e.g. Request a Site Assessment"
            className={cn(
              'w-full rounded-xl border border-border bg-white px-3 py-2',
              'text-sm text-text-primary placeholder-text-muted',
              'focus:border-brand-teal transition-colors duration-150'
            )}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">Length</label>
        <div className="flex gap-2">
          <Controller
            control={control}
            name="length"
            render={({ field }) =>
              LENGTH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-xs font-medium transition-all duration-150',
                    selectedLength === opt.value
                      ? 'border-brand-teal bg-brand-teal-light text-brand-teal'
                      : 'border-border bg-white text-text-secondary hover:bg-surface'
                  )}
                >
                  {opt.label}
                  <span className="block text-2xs font-normal mt-0.5 opacity-70">{opt.chars}</span>
                </button>
              )) as unknown as React.ReactElement
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm text-text-secondary">Include hashtags</label>
        <Controller
          control={control}
          name="include_hashtags"
          render={({ field }) => (
            <Switch.Root
              checked={field.value}
              onCheckedChange={field.onChange}
              className={cn(
                'relative w-10 h-5 rounded-full transition-colors duration-200 outline-none cursor-pointer',
                field.value ? 'bg-brand-teal' : 'bg-border'
              )}
            >
              <Switch.Thumb
                className={cn(
                  'block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                  'translate-x-0.5',
                  'data-[state=checked]:translate-x-[22px]'
                )}
              />
            </Switch.Root>
          )}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        loading={isLoading}
        disabled={isLoading}
        className="w-full font-semibold"
      >
        {isLoading ? 'Generating…' : 'Generate post →'}
      </Button>

      <p className="text-center text-2xs text-text-muted">
        Powered by Gemini 2.5 Flash + LangGraph
      </p>
    </form>
  )
}
