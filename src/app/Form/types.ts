export type ControlType = 'input';

export type UiSchema = {
  model: string;
  modelPlural: string;
  properties: {
    key: string;
    type: ControlType;
    templateOptions: {
      label: string;
      placeholder: string;
      required?: boolean;
    };
  }[];
};

export type FormProps = {
  uiSchema: UiSchema;
};
