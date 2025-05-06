import type { AnyFieldApi, FieldApi } from '@tanstack/react-form';
import { ControlType } from './types';

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return field.state.meta.isTouched && !field.state.meta.isValid ? (
    <em>{field.state.meta.errors.map((err) => err.message).join(', ')}</em>
  ) : null;
}

interface FieldProps {
  field: FieldApi;
  type: ControlType;
  templateOptions: {
    label: string;
    placeholder: string;
    required?: boolean;
    slotProps?: {
      containerProps?: Record<string, any>;
      labelProps?: Record<string, any>;
      controlProps?: Record<string, any>;
    };
  };
}

export function Field({ field, type, templateOptions }: FieldProps) {
  const { label, placeholder, required, slotProps = {} } = templateOptions;
  const { containerProps, labelProps, controlProps } = slotProps;

  return (
    <div {...containerProps}>
      {label && (
        <label htmlFor={field.name} {...labelProps}>
          {label}
        </label>
      )}

      <FieldSlot type={type} field={field} placeholder={placeholder} required={required} controlProps={controlProps} />
      <FieldInfo field={field} />
    </div>
  );
}

type FieldSlotProps = {
  type: ControlType;
  field: FieldApi;
  placeholder?: string;
  required?: boolean;
  controlProps?: Record<string, any>;
};

const FieldSlot = ({ type, field, placeholder, required, controlProps }: FieldSlotProps) => {
  if (type === 'input') {
    return (
      <input
        placeholder={placeholder}
        id={field.name}
        name={field.name}
        value={field.getValue()}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        required={required}
        {...controlProps}
      />
    );
  }
};
