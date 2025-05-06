import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Field } from './Field';
import { FormProps } from './types';

const initialValue = {
  firstName: '',
  lastName: '',
};

const zodSchema = z.object({
  firstName: z.string().nonempty('is required').length(3, 'must be at least 3 characters'),
  lastName: z.string(),
});

export function Form({ uiSchema }: FormProps) {
  const form = useForm({
    defaultValues: initialValue,
    validators: {
      onChange: zodSchema,
    },
    onSubmit: async ({ value }) => console.log(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {uiSchema.properties.map(({ key, type, templateOptions }) => (
        <form.Field
          key={key}
          name={key}
          children={(field) => <Field field={field} type={type} templateOptions={templateOptions} />}
        />
      ))}

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <button type="submit" disabled={!canSubmit}>
            {isSubmitting ? '...' : 'Submit'}
          </button>
        )}
      />
    </form>
  );
}
