/** Avisa as telas (sino, "Meus picos") que os avisos podem ter mudado, por exemplo depois de salvar as condições de um pico. */
export const ALERTS_EVENT = 'olhaonda:alerts'
export const notifyAlertsChanged = () => window.dispatchEvent(new Event(ALERTS_EVENT))
