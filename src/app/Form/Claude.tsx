import React, { useMemo } from 'react';
import { useForm, Controller } from '@tanstack/react-form';
import { z } from '@tanstack/zod';
import _ from 'lodash';

// Types for our JSON Schema
type JSONSchemaType = {
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  title?: string;
  description?: string;
};

type JSONSchemaProperty = {
  type: string;
  title?: string;
  description?: string;
  enum?: any[];
  enumNames?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  format?: string;
  default?: any;
  items?: JSONSchemaProperty;
};

// Convert JSON Schema to Zod schema
const convertToZodSchema = (schema: JSONSchemaType): z.ZodType<any> => {
  const { type, properties = {}, required = [] } = schema;

  if (type === 'object') {
    const shape: Record<string, z.ZodType<any>> = {};

    Object.entries(properties).forEach(([key, prop]) => {
      let fieldSchema = createZodTypeFromProperty(prop);

      // Make field required if in the required array
      if (!required.includes(key)) {
        fieldSchema = fieldSchema.optional();
      }

      shape[key] = fieldSchema;
    });

    return z.object(shape);
  }

  // For non-object schemas, just return a basic validation
  return z.any();
};

// Helper to create Zod types from JSON Schema properties
const createZodTypeFromProperty = (prop: JSONSchemaProperty): z.ZodType<any> => {
  const { type, minimum, maximum, minLength, maxLength, enum: enumValues } = prop;

  switch (type) {
    case 'string':
      let stringSchema = z.string();
      if (minLength !== undefined) stringSchema = stringSchema.min(minLength);
      if (maxLength !== undefined) stringSchema = stringSchema.max(maxLength);
      if (enumValues) return z.enum(enumValues as [string, ...string[]]);
      return stringSchema;

    case 'number':
    case 'integer':
      let numSchema = z.number();
      if (minimum !== undefined) numSchema = numSchema.min(minimum);
      if (maximum !== undefined) numSchema = numSchema.max(maximum);
      return numSchema;

    case 'boolean':
      return z.boolean();

    case 'array':
      if (prop.items) {
        return z.array(createZodTypeFromProperty(prop.items));
      }
      return z.array(z.any());

    default:
      return z.any();
  }
};

// Render field based on schema property
const FieldRenderer = ({
  name,
  property,
  control,
  isRequired,
}: {
  name: string;
  property: JSONSchemaProperty;
  control: any;
  isRequired: boolean;
}) => {
  const { type, title, description, enum: enumValues, enumNames } = property;
  const label = title || _.startCase(name);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>

      {description && <p className="text-sm text-gray-500 mb-1">{description}</p>}

      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          const { value, onChange, onBlur } = field;
          const { error } = fieldState;

          switch (type) {
            case 'string':
              // Handle enum as select
              if (enumValues) {
                return (
                  <>
                    <select
                      id={name}
                      value={value || ''}
                      onChange={onChange}
                      onBlur={onBlur}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select...</option>
                      {enumValues.map((val, index) => (
                        <option key={val} value={val}>
                          {enumNames ? enumNames[index] : val}
                        </option>
                      ))}
                    </select>
                    {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
                  </>
                );
              }

              // Handle format specific fields
              if (property.format === 'email') {
                return (
                  <>
                    <input
                      type="email"
                      id={name}
                      value={value || ''}
                      onChange={onChange}
                      onBlur={onBlur}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Email address"
                    />
                    {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
                  </>
                );
              }

              if (property.format === 'date') {
                return (
                  <>
                    <input
                      type="date"
                      id={name}
                      value={value || ''}
                      onChange={onChange}
                      onBlur={onBlur}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
                  </>
                );
              }

              // Default text input
              return (
                <>
                  <input
                    type="text"
                    id={name}
                    value={value || ''}
                    onChange={onChange}
                    onBlur={onBlur}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
                </>
              );

            case 'number':
            case 'integer':
              return (
                <>
                  <input
                    type="number"
                    id={name}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    onBlur={onBlur}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    min={property.minimum}
                    max={property.maximum}
                  />
                  {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
                </>
              );

            case 'boolean':
              return (
                <div className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    id={name}
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                    onBlur={onBlur}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  {error && <p className="ml-2 text-sm text-red-600">{error.message}</p>}
                </div>
              );

            default:
              return <p>Unsupported field type: {type}</p>;
          }
        }}
      />
    </div>
  );
};

// Main dynamic form component
interface DynamicFormProps {
  schema: JSONSchemaType;
  onSubmit: (data: any) => void;
  initialValues?: Record<string, any>;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ schema, onSubmit, initialValues = {} }) => {
  // Create validation schema from JSON Schema
  const validationSchema = useMemo(() => convertToZodSchema(schema), [schema]);

  // Initialize form
  const form = useForm({
    defaultValues: initialValues,
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
  });

  // Extract required fields from schema
  const requiredFields = schema.required || [];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {schema.title && <h2 className="text-xl font-bold mb-4">{schema.title}</h2>}
      {schema.description && <p className="mb-6 text-gray-600">{schema.description}</p>}

      {schema.type === 'object' && schema.properties && (
        <div>
          {Object.entries(schema.properties).map(([name, property]) => (
            <FieldRenderer
              key={name}
              name={name}
              property={property}
              control={form.control}
              isRequired={requiredFields.includes(name)}
            />
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit
        </button>
      </div>

      {form.state.submitError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {form.state.submitError.message}
        </div>
      )}
    </form>
  );
};

// Example usage of the Dynamic Form
export const FormExample = () => {
  // Example JSON Schema
  const exampleSchema: JSONSchemaType = {
    type: 'object',
    title: 'User Registration',
    description: 'Please fill out the following information to register.',
    properties: {
      name: {
        type: 'string',
        title: 'Full Name',
        description: 'Enter your full name',
        minLength: 2,
      },
      email: {
        type: 'string',
        title: 'Email Address',
        format: 'email',
      },
      age: {
        type: 'integer',
        title: 'Age',
        minimum: 18,
        maximum: 120,
      },
      role: {
        type: 'string',
        title: 'Role',
        enum: ['admin', 'user', 'editor'],
        enumNames: ['Administrator', 'Regular User', 'Editor'],
      },
      agreeToTerms: {
        type: 'boolean',
        title: 'Terms and Conditions',
        description: 'I agree to the terms and conditions',
      },
    },
    required: ['name', 'email', 'agreeToTerms'],
  };

  const handleSubmit = (data: any) => {
    console.log('Form submitted with data:', data);
    alert('Form submitted successfully!\n\n' + JSON.stringify(data, null, 2));
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <DynamicForm
        schema={exampleSchema}
        onSubmit={handleSubmit}
        initialValues={{
          role: 'user',
          agreeToTerms: false,
        }}
      />
    </div>
  );
};

export default DynamicForm;
