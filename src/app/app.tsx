import { Form } from './Form';
import type { UiSchema } from './Form/types';

const schema: UiSchema = {
  model: 'user',
  modelPlural: 'users',
  properties: [
    {
      key: 'firstName',
      type: 'input',
      templateOptions: {
        label: 'First Name',
        placeholder: 'Enter a first name',
        required: true,
        slots: {},
        slotProps: {
          containerProps: {
            style: {},
          },
        },
      },
    },
    {
      key: 'lastName',
      type: 'input',
      templateOptions: {
        label: 'Last Name',
        placeholder: 'Enter a last name',
      },
    },
  ],
};

function App() {
  return <Form uiSchema={schema} />;
}

export default App;
