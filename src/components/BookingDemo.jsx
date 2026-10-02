import { useMemo, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   Calendario di prenotazione — VERSIONE DIMOSTRATIVA
   Serve a mostrare al cliente il flusso (giorno → orario → conferma).
   Non invia nulla: gli slot sono di esempio e la conferma mostra solo
   un riepilogo con la dicitura "anteprima". Quando ci sarà un servizio
   reale (Calendly, Cal.com, Google Calendar) si sostituisce questo
   componente con il suo widget.
   ═══════════════════════════════════════════════════════════════ */

const SLOTS = ["09:30", "11:00", "14:30", "16:00", "17:30"];
const WEEKDAYS = ["L", "M", "M", "G", "V", "S", "D"];
const WEEKDAYS_FULL = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
const MAX_DAYS_AHEAD = 60;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => a && b && a.getTime() === b.getTime();
const monthLabel = (d) => d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
const longDate = (d) => d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
// lunedì = 0 … domenica = 6
const dow = (d) => (d.getDay() + 6) % 7;

// slot "occupati" di esempio, sempre uguali per lo stesso giorno
const busy = (day, i) => (day.getDate() * 7 + i * 3) % 5 === 0;

export default function BookingDemo() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const last = useMemo(() => new Date(today.getTime() + MAX_DAYS_AHEAD * 864e5), [today]);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [day, setDay] = useState(null);
  const [slot, setSlot] = useState(null);
  const [done, setDone] = useState(false);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const n = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out = Array.from({ length: dow(first) }, () => null);
    for (let i = 1; i <= n; i++) out.push(new Date(month.getFullYear(), month.getMonth(), i));
    return out;
  }, [month]);

  const available = (d) => d >= today && d <= last && dow(d) < 5;
  const canPrev = month > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= last;

  const pickDay = (d) => {
    setDay(d);
    setSlot(null);
    setDone(false);
  };

  return (
    <div className="s5-cal" aria-label="Calendario di prenotazione (anteprima)">
      <div className="s5-cal__top">
        <span className="s5-cal__demo">Anteprima</span>
        <span className="s5-cal__dur">30 min · videochiamata</span>
      </div>

      <div className="s5-cal__month">
        <button
          type="button"
          className="s5-cal__nav"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          disabled={!canPrev}
          aria-label="Mese precedente"
        >
          ‹
        </button>
        <p className="s5-cal__label" aria-live="polite">
          {monthLabel(month)}
        </p>
        <button
          type="button"
          className="s5-cal__nav"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          disabled={!canNext}
          aria-label="Mese successivo"
        >
          ›
        </button>
      </div>

      <div className="s5-cal__grid">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="s5-cal__wd" aria-hidden="true">
            {w}
          </span>
        ))}
        {cells.map((d, i) =>
          d ? (
            <button
              key={i}
              type="button"
              className={
                "s5-cal__day" + (sameDay(d, day) ? " is-on" : "") + (sameDay(d, today) ? " is-today" : "")
              }
              disabled={!available(d)}
              aria-pressed={sameDay(d, day)}
              aria-label={`${WEEKDAYS_FULL[dow(d)]} ${d.getDate()} ${monthLabel(d)}`}
              onClick={() => pickDay(d)}
            >
              {d.getDate()}
            </button>
          ) : (
            <span key={i} aria-hidden="true" />
          )
        )}
      </div>

      <div className="s5-cal__slots" role="group" aria-label="Orari disponibili">
        {day ? (
          SLOTS.map((t, i) => {
            const off = busy(day, i);
            return (
              <button
                key={t}
                type="button"
                className={"s5-cal__slot" + (slot === t ? " is-on" : "")}
                disabled={off}
                aria-pressed={slot === t}
                onClick={() => {
                  setSlot(t);
                  setDone(false);
                }}
              >
                {t}
                {off && <span className="sr-only"> (occupato)</span>}
              </button>
            );
          })
        ) : (
          <p className="s5-cal__hint">Scegli un giorno per vedere gli orari.</p>
        )}
      </div>

      <button
        type="button"
        className="s5-btn s5-btn--solid s5-cal__confirm"
        disabled={!day || !slot}
        onClick={() => setDone(true)}
      >
        <span>Conferma prenotazione</span>
      </button>

      <p className="s5-cal__msg" aria-live="polite">
        {done && day && slot && (
          <>
            <strong>
              {longDate(day)} · {slot}
            </strong>
            <span>Questa è un’anteprima: la prenotazione non viene ancora inviata.</span>
          </>
        )}
      </p>
    </div>
  );
}
