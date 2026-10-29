/* 研途 · 仅影响界面、不写入备份的临时状态 */

export const ui = {
  route: 'today',
  mobileMenu: false,
  politicsTab: 'practice',
  englishTab: 'vocab',
  reciteFilter: 'due',
  reciteRevealed: false,
  checkinEdit: false,
  modal: null,
  lastSavedFlash: false,
};

export function setUI(patch) {
  Object.assign(ui, patch);
}

export function closeModal() {
  ui.modal = null;
}

export function resetTransient() {
  ui.mobileMenu = false;
  ui.reciteRevealed = false;
  ui.modal = null;
}
