jest.mock('../contexts/LanguageContext', () => ({ useTranslation: () => ({ t: key => key }) }));
import { getNaturalCalculationWindow } from './EventShopSimulator';

const summary = { eventId: 7, endAt: Date.parse('2026-09-30T12:00:00+09:00') };
const event = { id: 7, startAt: Date.parse('2026-09-01T12:00:00+09:00'), aggregateAt: Date.parse('2026-09-10T21:00:00+09:00') };

test('remaining income ends at event scoring cutoff, not shop closing', () => {
  const now = Date.parse('2026-09-09T15:00:00+09:00');
  expect(getNaturalCalculationWindow(summary, [event], null, now)).toEqual({ start: now, end: event.aggregateAt, active: true });
});
test('closed events have no future income even when exchange is still open', () => {
  expect(getNaturalCalculationWindow(summary, [event], null, event.aggregateAt + 1).active).toBe(false);
});
test('future events exclude time before the event starts', () => {
  expect(getNaturalCalculationWindow(summary, [event], null, event.startAt - 86400000).start).toBe(event.startAt);
});
test('does not use another events dates as fallback', () => {
  expect(getNaturalCalculationWindow(summary, [], { ...event, id: 8 }, event.startAt).active).toBe(false);
});
