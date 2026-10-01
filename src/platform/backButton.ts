/**
 * PLAN §11.1: nút Back Android / vuốt back không được thoát game. Đẩy một entry history khi vào game,
 * mỗi lần `popstate` thì đẩy lại entry và báo `onBack` (để mở PauseOverlay).
 */
export const registerBackButton = (onBack: () => void): (() => void) => {
  history.pushState({ qvn: true }, '');
  const listener = (): void => {
    history.pushState({ qvn: true }, '');
    onBack();
  };
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
};
