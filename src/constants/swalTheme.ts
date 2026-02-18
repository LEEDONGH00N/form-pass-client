import Swal, { SweetAlertOptions } from 'sweetalert2';

export const SWAL_CUSTOM_CLASS = {
  popup: '!rounded-2xl !shadow-2xl !bg-white !p-0 !overflow-hidden',
  container: '!bg-black/60 !backdrop-blur-sm',
  title: '!text-xl !font-bold !text-gray-900 !pt-8 !px-8 !pb-2 !m-0',
  htmlContainer: '!text-gray-500 !text-sm !px-8 !py-3 !m-0',
  icon: '!mt-8 !mb-0',
  actions: '!px-8 !pb-8 !pt-4 !gap-3',
  confirmButton: '!bg-gradient-to-r !from-blue-500 !to-blue-600 !text-white !font-semibold !rounded-xl !px-6 !py-3 !border-0 !shadow-lg !shadow-blue-500/25 hover:!from-blue-600 hover:!to-blue-700 !transition-all',
  cancelButton: '!bg-gray-100 !text-gray-700 !font-semibold !rounded-xl !px-6 !py-3 !border-0 hover:!bg-gray-200 !transition-all',
  denyButton: '!bg-red-50 !text-red-600 !font-semibold !rounded-xl !px-6 !py-3 !border-0 hover:!bg-red-100 !transition-all',
  closeButton: '!text-gray-400 hover:!text-gray-600 !transition-colors',
  validationMessage: '!bg-red-50 !text-red-600 !text-sm !rounded-xl !mx-8 !mt-2 !py-3',
  input: '!rounded-xl !border !border-gray-200 !bg-white focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-500/10 !transition-all !text-gray-900',
};

export const SWAL_BASE_OPTIONS: SweetAlertOptions = {
  customClass: SWAL_CUSTOM_CLASS,
  buttonsStyling: false,
  showClass: {
    popup: 'animate__animated animate__fadeIn animate__faster',
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOut animate__faster',
  },
};

export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    ...SWAL_BASE_OPTIONS,
    icon: 'success',
    title,
    text,
    confirmButtonText: '확인',
    timer: 2000,
    timerProgressBar: true,
  });
};

export const showError = (title: string, text?: string) => {
  return Swal.fire({
    ...SWAL_BASE_OPTIONS,
    icon: 'error',
    title,
    text,
    confirmButtonText: '확인',
  });
};

export const showWarning = (title: string, text?: string) => {
  return Swal.fire({
    ...SWAL_BASE_OPTIONS,
    icon: 'warning',
    title,
    text,
    confirmButtonText: '확인',
  });
};

export const showInfo = (title: string, text?: string) => {
  return Swal.fire({
    ...SWAL_BASE_OPTIONS,
    icon: 'info',
    title,
    text,
    confirmButtonText: '확인',
  });
};

export const showConfirm = (title: string, text?: string, confirmText = '확인', cancelText = '취소') => {
  return Swal.fire({
    ...SWAL_BASE_OPTIONS,
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
};

export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    customClass: {
      popup: '!rounded-xl !shadow-lg !py-3 !px-4',
      title: '!text-sm !font-semibold !text-gray-800',
    },
  });
};

export const showLoading = (title = '처리 중...') => {
  return Swal.fire({
    ...SWAL_BASE_OPTIONS,
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const closeLoading = () => {
  Swal.close();
};

export const showCustomModal = (options: SweetAlertOptions) => {
  return Swal.fire({
    ...SWAL_BASE_OPTIONS,
    ...options,
  } as SweetAlertOptions);
};

export default Swal;
