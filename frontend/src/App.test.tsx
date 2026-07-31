import React from 'react';
import { render } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';

jest.mock('@ionic/react', () => ({
  IonApp: ({ children }: any) => <div data-testid="ion-app">{children}</div>,
  IonContent: ({ children }: any) => <div data-testid="ion-content">{children}</div>,
}));

test('renders app root without crashing', () => {
  const { container } = render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  expect(container).toBeDefined();
});

