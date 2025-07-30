import { create } from 'zustand';

interface ContactFormState {
  formData: {
    name: string;
    email: string;
    phone: string;
    message: string;
    isBusiness: boolean;
  };
  setFormData: (data: Partial<ContactFormState['formData']>) => void;
  resetFormData: () => void;
}

export const useContactStore = create<ContactFormState>((set) => ({
  formData: {
    name: '',
    email: '',
    phone: '',
    message: '',
    isBusiness: false,
  },
  setFormData: (data) =>
    set((state) => ({
      formData: {
        ...state.formData,
        ...data,
      },
    })),
  resetFormData: () =>
    set({
      formData: {
        name: '',
        email: '',
        phone: '',
        message: '',
        isBusiness: false,
      },
    }),
}));
